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

    private output : boolean[][][];
    private entropyMap : number[][];

    constructor(path : String, outputDims : [number, number]) {
        var jsonData : jsonRules = JSON.parse(fs.readFileSync('' + path, 'utf-8'));

        this.lookUp = jsonData.map(e => e.Path);
        this.weightings = jsonData.map(e => e.Weight);
        this.ruleset = jsonData.map(e => e.Rules);

        this.output = new Array(outputDims[0]);
        for(let i = 0; i < outputDims[0]; i++) {
            this.output[i] = new Array(outputDims[1]);
            
            for(let j = 0; j < outputDims[1]; j++) {
                this.output[i][j] = new Array(this.lookUp.length);
                this.output[i][j] = this.output[i][j].fill(true);
            }
        }

        this.entropyMap = new Array(outputDims[0]);
        for(let i = 0; i < outputDims[0]; i++) {
            this.entropyMap[i] = new Array(outputDims[1]);
            this.entropyMap[i] = this.entropyMap[i].fill(this.lookUp.length);
        }
    }

    public collapse() {
        
    }

    // public getResultAsDecodedPNG() : DecodedPng {
        
    // }

    public saveResultAsFile(filePath : string) {
        var img = fs.createReadStream('tilesets/test.png');
        var imgBuff : IOBuffer;
        let chunks : Buffer[] = [];

        img.on('data', (chunk) => {
            chunks.push(chunk as Buffer);
        });

        img.once('end', () => {
            imgBuff = new IOBuffer(Buffer.concat(chunks));
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

    // private chooseNextField() : [number, number] {

    // }

    // private chooseTileToPlace() : number {

    // }

    // private propagateChanges() {}
}

let a = new WfcModel('tilesets/tileset1/rules.json', [5, 5]);
a.saveResultAsFile("testChanges.png");