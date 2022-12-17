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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const png = __importStar(require("fast-png"));
const iobuffer_1 = require("iobuffer");
class WfcModel {
    constructor(path, outputDims) {
        var jsonData = JSON.parse(fs.readFileSync('' + path, 'utf-8'));
        this.lookUp = jsonData.map(e => e.Path);
        this.weightings = jsonData.map(e => e.Weight);
        this.ruleset = jsonData.map(e => e.Rules);
        this.output = new Array(outputDims[0]);
        for (let i = 0; i < outputDims[0]; i++) {
            this.output[i] = new Array(outputDims[1]);
            for (let j = 0; j < outputDims[1]; j++) {
                this.output[i][j] = new Array(this.lookUp.length);
                this.output[i][j] = this.output[i][j].fill(true);
            }
        }
        this.entropyMap = new Array(outputDims[0]);
        for (let i = 0; i < outputDims[0]; i++) {
            this.entropyMap[i] = new Array(outputDims[1]);
            this.entropyMap[i] = this.entropyMap[i].fill(this.lookUp.length);
        }
    }
    collapse() {
    }
    // public getResultAsDecodedPNG() : DecodedPng {
    // }
    saveResultAsFile(filePath) {
        var img = fs.createReadStream('tilesets/test.png');
        var imgBuff;
        let chunks = [];
        img.on('data', (chunk) => {
            chunks.push(chunk);
        });
        img.once('end', () => {
            imgBuff = new iobuffer_1.IOBuffer(Buffer.concat(chunks));
            var a = png.decode(imgBuff);
            a.data[0] = 3;
            a.data[1] = 36;
            a.data[2] = 252;
            var b = png.encode(a);
            fs.writeFile('' + filePath, b, () => {
                console.log("all written up boss");
            });
        });
    }
}
let a = new WfcModel('tilesets/tileset1/rules.json', [5, 5]);
a.saveResultAsFile("testChanges.png");
