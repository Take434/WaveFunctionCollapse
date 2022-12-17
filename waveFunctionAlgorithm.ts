import * as fs from 'fs';

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

    constructor(path : String) {
        var jsonData : jsonRules = JSON.parse(fs.readFileSync('' + path, 'utf-8'));

        console.log(jsonData);

        this.lookUp = jsonData.map(e => e.Path);
        this.weightings = jsonData.map(e => e.Weight);
        this.ruleset = jsonData.map(e => e.Rules);

        console.log("and now my stuff");

        console.log(this.lookUp)
        console.log("---------------------------");
        console.log(this.ruleset);
        console.log("---------------------------");
        console.log(this.weightings);
    }

    public wfc(width : number, height : number) : boolean[][][]{
        return [[[]]];
    }
}

let a = new WfcModel('tilesets/tileset1/rules.json');