import { B } from "./B";
import { BranchMap } from "./BranchMap";
import { F } from "./F";
import { FunctionMap } from "./FunctionMap";
import { S } from "./S";
import { StatementMap } from "./StatementMap";

export interface Entry {
    path: string;
    statementMap: StatementMap;
    branchMap: BranchMap;
    fnMap: FunctionMap;
    s: S;
    f: F;
    b: B;
}