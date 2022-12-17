import * as fs from 'fs';
import * as png from 'fast-png';
import { IOBuffer } from 'iobuffer';
import { DecodedPng } from 'fast-png';
import Stack from 'ts-data.stack';

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
        let jsonData : jsonRules = JSON.parse(fs.readFileSync('' + path, 'utf-8'));

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

            this.isCollapsed = this.checkCollapsed();
        }

        if(this.isContradicted) {
            console.error("reached Contradiction");
        }
    }

    public reCollapse() {
        this.initializeOutput();
        this.collapse();
    }

    public getResultAsDecodedPNG()/* : DecodedPng */{
        console.log(this.output);
    }

    public async saveResultAsFile(filePath : string) {
        const a : DecodedPng = png.decode(await this.getImgAsIOBuffer("tilesets/test.png"));
    }

    private getImgAsIOBuffer(filePath : string) : Promise<IOBuffer> {
        return new Promise((resolve, reject) => {
            let img = fs.createReadStream('tilesets/test.png');
            let imgBuff : IOBuffer;
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
        let nextField : [number, number] = [0, 0];
        let lowestEntropy : number = this.entropyMap[0][0];

        for(let i = 0; i < this.entropyMap.length; i++) {
            for(let j = 0; j < this.entropyMap[i].length; j++) {
                if(lowestEntropy === 1 || this.entropyMap[i][j] < lowestEntropy) {
                    lowestEntropy = this.entropyMap[i][j];
                    nextField = [i, j];
                }
            }
        }

        return nextField;
    }

    private placeTile(field : [number, number]) {
        const fieldDomain : boolean[] = this.output[field[0]][field[1]];
        const fieldDomainWeights : number[] = [];

        for(let i = 0; i < fieldDomain.length; i++) {
            if(fieldDomain[i]) {
                fieldDomainWeights.push(this.weightings[i]);
            } else {
                fieldDomainWeights.push(0);
            }
        }

        const cumulatedWeights : number = fieldDomainWeights.reduce((partialSum, a) => partialSum += a);
        let randNum : number = Math.random() * cumulatedWeights;

        for(let i = 0; i < fieldDomainWeights.length; i++) {
            if(fieldDomainWeights[i] === 0) {
                continue;
            }

            if(fieldDomainWeights[i] >= randNum) {
                this.output[field[0]][field[1]].fill(false);
                this.output[field[0]][field[1]][i] = true;

                this.entropyMap[field[0]][field[1]] = 1;

                return;
            }

            randNum -= fieldDomainWeights[i];
        }
    }

    private propagateChanges(field : [number, number]) {
        let propagationStack : Stack<[number, number]> = new Stack<[number, number]>();

        this.pushNeighbours(field, propagationStack);

        while(!propagationStack.isEmpty()) {
            const fieldToPropagate : [number, number] = propagationStack.pop();

            let possibleTiles : number[] = [];

            //check ruleset for all possible tiles in field above
            if(this.isFieldOnOutput([fieldToPropagate[0] - 1, fieldToPropagate[1]])) {
                const indiciesForRules : number[] = this.output[fieldToPropagate[0] - 1][fieldToPropagate[1]].map((v, i) => {
                    if(v) {
                        return i;
                    }
                }) as number[];

                indiciesForRules.filter(e => e).forEach(e => {
                    possibleTiles = possibleTiles.concat(this.ruleset[e][2]);
                });
            }

            //check ruleset for all possible tiles in field to the right
            if(this.isFieldOnOutput([fieldToPropagate[0], fieldToPropagate[1] + 1])) {
                const indiciesForRules : number[] = this.output[fieldToPropagate[0]][fieldToPropagate[1] + 1].map((v, i) => {
                    if(v) {
                        return i;
                    }
                }) as number[];

                indiciesForRules.filter(e => e).forEach(e => {
                    possibleTiles = possibleTiles.concat(this.ruleset[e][2]);
                });
            }

            //check ruleset for all possible tiles in field below
            if(this.isFieldOnOutput([fieldToPropagate[0] + 1, fieldToPropagate[1]])) {
                const indiciesForRules : number[] = this.output[fieldToPropagate[0] + 1][fieldToPropagate[1]].map((v, i) => {
                    if(v) {
                        return i;
                    }
                }) as number[];

                indiciesForRules.filter(e => e).forEach(e => {
                    possibleTiles = possibleTiles.concat(this.ruleset[e][2]);
                });
            }

            //check ruleset for all possible tiles in field to the left
            if(this.isFieldOnOutput([fieldToPropagate[0], fieldToPropagate[1] - 1])) {
                const indiciesForRules : number[] = this.output[fieldToPropagate[0]][fieldToPropagate[1] - 1].map((v, i) => {
                    if(v) {
                        return i;
                    }
                }) as number[];

                indiciesForRules.filter(e => e).forEach(e => {
                    possibleTiles = possibleTiles.concat(this.ruleset[e][2]);
                });
            }

            possibleTiles = possibleTiles.filter((v, i, self) => { self.indexOf(v) === i });

            let changed : boolean = false;
            for(let i = 0; i < this.output[fieldToPropagate[0]][fieldToPropagate[1]].length; i++) {
                if(!possibleTiles.includes(i) && !this.output[fieldToPropagate[0]][fieldToPropagate[1]][i]) {
                    this.output[fieldToPropagate[0]][fieldToPropagate[1]][i] = false;
                    changed = true;
                }
            }

            if(changed) {
                this.pushNeighbours(fieldToPropagate, propagationStack);
            }
        }
    }

    private pushNeighbours(field : [number, number], propagationStack : Stack<[number, number]>) {
        if(this.isFieldOnOutput([field[0] - 1, field[1]]) && this.entropyMap[field[0] - 1][field[1]] > 1) {
            propagationStack.push([field[0] - 1, field[1]]);
        }
        if(this.isFieldOnOutput([field[0], field[1] + 1]) && this.entropyMap[field[0]][field[1] + 1] > 1) {
            propagationStack.push([field[0], field[1] + 1]);
        }
        if(this.isFieldOnOutput([field[0] + 1, field[1]]) && this.entropyMap[field[0] + 1][field[1]] > 1) {
            propagationStack.push([field[0] + 1, field[1]]);
        }
        if(this.isFieldOnOutput([field[0] , field[1] - 1]) && this.entropyMap[field[0]][field[1] - 1] > 1) {
            propagationStack.push([field[0] , field[1] - 1]);
        }
    }

    private isFieldOnOutput(field : [number, number]) : boolean {

        if(field[0] < 0 || field[1] < 0) {
            return false;
        }

        return field[0] < this.output.length && field[1] < this.output[field[0]].length;
    }

    private checkCollapsed() : boolean {
        for(let e of this.entropyMap) {
            for(let a of e) {
                if(a > 1) {
                    return false;
                }
            }
        }

        return true;
    }
}

let a = new WfcModel('tilesets/tileset1/rules.json', [5, 5]);
a.collapse();
a.getResultAsDecodedPNG();