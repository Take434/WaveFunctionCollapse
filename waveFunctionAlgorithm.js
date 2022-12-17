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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const iobuffer_1 = require("iobuffer");
class WfcModel {
    constructor(path, outputDims) {
        this.output = [[[]]];
        this.entropyMap = [[]];
        this.isCollapsed = false;
        this.isContradicted = false;
        var jsonData = JSON.parse(fs.readFileSync('' + path, 'utf-8'));
        this.lookUp = jsonData.map(e => e.Path);
        this.weightings = jsonData.map(e => e.Weight);
        this.ruleset = jsonData.map(e => e.Rules);
        this.outputDims = outputDims;
        this.initializeOutput();
        console.log(this.output);
        console.log(this.entropyMap);
    }
    collapse() {
        while (!this.isCollapsed) {
            const nextField = this.chooseNextField();
            this.placeTile(nextField);
            this.propagateChanges(nextField);
        }
        if (this.isContradicted) {
            console.error("reached Contradiction");
        }
    }
    reCollapse() {
        this.initializeOutput();
        this.collapse();
    }
    // public getResultAsDecodedPNG() : DecodedPng {
    // }
    saveResultAsFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getImgAsIOBuffer(filePath) {
        return new Promise((resolve, reject) => {
            var img = fs.createReadStream('tilesets/test.png');
            var imgBuff;
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
        return [0, 0];
    }
    placeTile(field) {
        return 0;
    }
    propagateChanges(field) {
    }
}
let a = new WfcModel('tilesets/tileset1/rules.json', [5, 5]);
