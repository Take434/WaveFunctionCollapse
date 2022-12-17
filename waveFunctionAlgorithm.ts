import * as fs from 'fs';
import * as png from 'fast-png';
import { IOBuffer } from 'iobuffer';
import { DecodedPng } from 'fast-png';

type jsonRules = [
    {
        Path : string,
        Weight : number, 
        Rules : number[][]
    }
]

class WfcModel {

    private lookUp : String[];
    private weightings : number[];
    private ruleset : number[][][];
    private outputDims : [number, number];

    private output : boolean[][][] = [[[]]];
    private entropyMap : number[][] = [[]];

    public isCollapsed : boolean = false;
    public isContradicted : boolean = false;

    constructor(path : String, outputDims : [number, number]) {
        var jsonData : jsonRules = JSON.parse(fs.readFileSync('' + path, 'utf-8'));

        this.lookUp = jsonData.map(e => e.Path);
        this.weightings = jsonData.map(e => e.Weight);
        this.ruleset = jsonData.map(e => e.Rules);
        this.outputDims = outputDims;

        this.initializeOutput();
    }

    public collapse() {

        while(!this.isCollapsed) {
            const nextField : [number, number] = this.chooseNextField();

            this.placeTile(nextField);

            this.propagateChanges(nextField);
        }

        if(this.isContradicted) {
            console.error("reached Contradiction");
        }
    }

    public reCollapse() {
        this.initializeOutput();
        this.collapse();
    }

    // public getResultAsDecodedPNG() : DecodedPng {
        
    // }

    public async saveResultAsFile(filePath : string) {
        
    }

    private getImgAsIOBuffer(filePath : string) : Promise<IOBuffer> {

        return new Promise((resolve, reject) => {
            var img = fs.createReadStream('tilesets/test.png');
            var imgBuff : IOBuffer;
            let chunks : Buffer[] = [];

            img.on('data', (chunk) => {
                chunks.push(chunk as Buffer);
            });

            img.once('end', () => {
                resolve(new IOBuffer(Buffer.concat(chunks)));
            });

            img.once('error', (e) => {
                reject(e);
            })
        });
    }

    private initializeOutput() {

        this.output = new Array(this.outputDims[0]);
        for(let i = 0; i < this.outputDims[0]; i++) {
            this.output[i] = new Array(this.outputDims[1]);
            
            for(let j = 0; j < this.outputDims[1]; j++) {
                this.output[i][j] = new Array(this.lookUp.length);
                this.output[i][j] = this.output[i][j].fill(true);
            }
        }

        this.entropyMap = new Array(this.outputDims[0]);
        for(let i = 0; i < this.outputDims[0]; i++) {
            this.entropyMap[i] = new Array(this.outputDims[1]);
            this.entropyMap[i] = this.entropyMap[i].fill(this.lookUp.length);
        }
    }

    private chooseNextField() : [number, number] {
        
    }

    private placeTile(field : [number, number]) : number {
        
    }

    private propagateChanges(field : [number, number]) {

    }
}

let a = new WfcModel('tilesets/tileset1/rules.json', [5, 5]);