"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const png = __importStar(require("fast-png"));
const iobuffer_1 = require("iobuffer");
const ts_data_stack_1 = __importDefault(require("ts-data.stack"));
class MyDecodedPng {
    constructor(w, h, data, depth, channels, text) {
        this.width = w;
        this.height = h;
        this.channels = channels;
        this.data = data;
        this.depth = depth;
        this.text = text !== null && text !== void 0 ? text : {};
    }
}
class WfcModel {
    constructor(path, outputDims) {
        this.output = [[[]]];
        this.entropyMap = [[]];
        this.isCollapsed = false;
        this.isContradicted = false;
        let jsonData = JSON.parse(fs.readFileSync('' + path, 'utf-8'));
        this.lookUp = jsonData.map(e => e.Path);
        this.weightings = jsonData.map(e => e.Weight);
        this.ruleset = jsonData.map(e => e.Rules);
        this.outputDims = outputDims;
        this.initializeOutput();
    }
    collapse() {
        while (!this.isCollapsed) {
            const nextField = this.chooseNextField();
            this.placeTile(nextField);
            this.propagateChanges(nextField);
            this.isCollapsed = this.checkCollapsed();
        }
        if (this.isContradicted) {
            console.error("reached Contradiction");
        }
    }
    reCollapse() {
        this.initializeOutput();
        this.collapse();
    }
    getResultAsDecodedPNG() {
        console.log(this.output);
    }
    saveResultAsFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const tileImages = [];
            for (let p of this.lookUp) {
                tileImages.push(png.decode(yield this.getImgAsIOBuffer('' + p)));
            }
            const outputTileArrangement = new Array(this.output.length);
            for (let i = 0; i < outputTileArrangement.length; i++) {
                outputTileArrangement[i] = new Array(this.output[i].length);
            }
            for (let i = 0; i < this.output.length; i++) {
                for (let j = 0; j < this.output[i].length; j++) {
                    for (let k = 0; k < this.output[i][j].length; k++) {
                        if (this.output[i][j][k]) {
                            outputTileArrangement[i][j] = tileImages[k];
                            break;
                        }
                    }
                }
            }
            let outputImageArray = [];
            const x = tileImages[0].height;
            for (let e of outputTileArrangement) {
                for (let i = 0; i < x; i++) {
                    for (let j = 0; j < e.length; j++) {
                        e[j].data.subarray(i * x * 3, (i + 1) * x * 3).forEach(e => {
                            outputImageArray.push(e);
                        });
                    }
                }
            }
            let a = new Uint16Array(outputImageArray);
            const img = new MyDecodedPng(x * this.outputDims[0], x * this.outputDims[1], a, 8, 3);
            fs.writeFileSync('' + filePath, png.encode(img));
        });
    }
    getImgAsIOBuffer(filePath) {
        return new Promise((resolve, reject) => {
            let img = fs.createReadStream('' + filePath);
            let chunks = [];
            img.on('data', (chunk) => {
                chunks.push(chunk);
            });
            img.once('end', () => {
                resolve(new iobuffer_1.IOBuffer(Buffer.concat(chunks)));
            });
            img.once('error', (e) => {
                reject(e);
            });
        });
    }
    initializeOutput() {
        this.output = new Array(this.outputDims[0]);
        for (let i = 0; i < this.outputDims[0]; i++) {
            this.output[i] = new Array(this.outputDims[1]);
            for (let j = 0; j < this.outputDims[1]; j++) {
                this.output[i][j] = new Array(this.lookUp.length);
                this.output[i][j] = this.output[i][j].fill(true);
            }
        }
        this.entropyMap = new Array(this.outputDims[0]);
        for (let i = 0; i < this.outputDims[0]; i++) {
            this.entropyMap[i] = new Array(this.outputDims[1]);
            this.entropyMap[i] = this.entropyMap[i].fill(this.lookUp.length);
        }
    }
    chooseNextField() {
        let nextField = [0, 0];
        let lowestEntropy = this.entropyMap[0][0];
        for (let i = 0; i < this.entropyMap.length; i++) {
            for (let j = 0; j < this.entropyMap[i].length; j++) {
                if (lowestEntropy === 1 || this.entropyMap[i][j] < lowestEntropy) {
                    lowestEntropy = this.entropyMap[i][j];
                    nextField = [i, j];
                }
            }
        }
        return nextField;
    }
    placeTile(field) {
        const fieldDomain = this.output[field[0]][field[1]];
        const fieldDomainWeights = [];
        for (let i = 0; i < fieldDomain.length; i++) {
            if (fieldDomain[i]) {
                fieldDomainWeights.push(this.weightings[i]);
            }
            else {
                fieldDomainWeights.push(0);
            }
        }
        const cumulatedWeights = fieldDomainWeights.reduce((partialSum, a) => partialSum += a);
        let randNum = Math.random() * cumulatedWeights;
        for (let i = 0; i < fieldDomainWeights.length; i++) {
            if (fieldDomainWeights[i] === 0) {
                continue;
            }
            if (fieldDomainWeights[i] >= randNum) {
                this.output[field[0]][field[1]].fill(false);
                this.output[field[0]][field[1]][i] = true;
                this.entropyMap[field[0]][field[1]] = 1;
                return;
            }
            randNum -= fieldDomainWeights[i];
        }
    }
    propagateChanges(field) {
        let propagationStack = new ts_data_stack_1.default();
        this.pushNeighbours(field, propagationStack);
        while (!propagationStack.isEmpty()) {
            const fieldToPropagate = propagationStack.pop();
            let possibleTiles = [];
            //check ruleset for all possible tiles in field above
            if (this.isFieldOnOutput([fieldToPropagate[0] - 1, fieldToPropagate[1]])) {
                const indiciesForRules = this.output[fieldToPropagate[0] - 1][fieldToPropagate[1]].map((v, i) => {
                    if (v) {
                        return i;
                    }
                });
                indiciesForRules.filter(e => e).forEach(e => {
                    possibleTiles = possibleTiles.concat(this.ruleset[e][2]);
                });
            }
            //check ruleset for all possible tiles in field to the right
            if (this.isFieldOnOutput([fieldToPropagate[0], fieldToPropagate[1] + 1])) {
                const indiciesForRules = this.output[fieldToPropagate[0]][fieldToPropagate[1] + 1].map((v, i) => {
                    if (v) {
                        return i;
                    }
                });
                indiciesForRules.filter(e => e).forEach(e => {
                    possibleTiles = possibleTiles.concat(this.ruleset[e][2]);
                });
            }
            //check ruleset for all possible tiles in field below
            if (this.isFieldOnOutput([fieldToPropagate[0] + 1, fieldToPropagate[1]])) {
                const indiciesForRules = this.output[fieldToPropagate[0] + 1][fieldToPropagate[1]].map((v, i) => {
                    if (v) {
                        return i;
                    }
                });
                indiciesForRules.filter(e => e).forEach(e => {
                    possibleTiles = possibleTiles.concat(this.ruleset[e][2]);
                });
            }
            //check ruleset for all possible tiles in field to the left
            if (this.isFieldOnOutput([fieldToPropagate[0], fieldToPropagate[1] - 1])) {
                const indiciesForRules = this.output[fieldToPropagate[0]][fieldToPropagate[1] - 1].map((v, i) => {
                    if (v) {
                        return i;
                    }
                });
                indiciesForRules.filter(e => e).forEach(e => {
                    possibleTiles = possibleTiles.concat(this.ruleset[e][2]);
                });
            }
            //fucky wucky
            possibleTiles = possibleTiles.filter((v, i, self) => self.indexOf(v) === i);
            let changed = false;
            for (let i = 0; i < this.output[fieldToPropagate[0]][fieldToPropagate[1]].length; i++) {
                if (!possibleTiles.includes(i) && !this.output[fieldToPropagate[0]][fieldToPropagate[1]][i]) {
                    this.output[fieldToPropagate[0]][fieldToPropagate[1]][i] = false;
                    changed = true;
                }
            }
            if (changed) {
                this.pushNeighbours(fieldToPropagate, propagationStack);
            }
        }
    }
    pushNeighbours(field, propagationStack) {
        if (this.isFieldOnOutput([field[0] - 1, field[1]]) && this.entropyMap[field[0] - 1][field[1]] > 1) {
            propagationStack.push([field[0] - 1, field[1]]);
        }
        if (this.isFieldOnOutput([field[0], field[1] + 1]) && this.entropyMap[field[0]][field[1] + 1] > 1) {
            propagationStack.push([field[0], field[1] + 1]);
        }
        if (this.isFieldOnOutput([field[0] + 1, field[1]]) && this.entropyMap[field[0] + 1][field[1]] > 1) {
            propagationStack.push([field[0] + 1, field[1]]);
        }
        if (this.isFieldOnOutput([field[0], field[1] - 1]) && this.entropyMap[field[0]][field[1] - 1] > 1) {
            propagationStack.push([field[0], field[1] - 1]);
        }
    }
    isFieldOnOutput(field) {
        if (field[0] < 0 || field[1] < 0) {
            return false;
        }
        return field[0] < this.output.length && field[1] < this.output[field[0]].length;
    }
    checkCollapsed() {
        for (let e of this.entropyMap) {
            for (let a of e) {
                if (a > 1) {
                    return false;
                }
            }
        }
        return true;
    }
}
let a = new WfcModel('tilesets/tileset1/rules.json', [10, 10]);
a.collapse();
a.saveResultAsFile('testChanges.png');
