import { promisify, inspect } from "util"
import { readdir, exists, stat, mkdir, writeFile, readFile, Stats, unlink, Dirent, } from "fs";
import { COVERAGE_DIR, COVERAGE_FILE, COVERAGE_RESULTS_SUFFIX, JSON_INDENT, SOURCE_DIR } from "../constants";
import { sep } from "path";
import { Adata } from "./doc/adata/Adata";
import { StatementMap } from "./doc/nyc/StatementMap";
import { Entries } from "./doc/nyc/Entries";
import { BranchMap } from "./doc/nyc/BranchMap";
import { FunctionMap } from "./doc/nyc/FunctionMap";
import { S } from "./doc/nyc/S";
import { B } from "./doc/nyc/B";
import { F } from "./doc/nyc/F";
import { basename } from "path";
import { resolve } from "path";

const stats = promisify(stat);
const read = promisify(readFile);
const write = promisify(writeFile);

// https://github.com/gotwarlost/istanbul/blob/master/coverage.json.md

// TODO(Kelosky): read in ADATA and send to z/OS data set to be read by zcov
// TODO(Kelosky): this method should download output
export async function parseCoverage(file: string) {

    console.log(`⚠️  This command probably does not belong here`);

    try {
        await stats(file)
    } catch (err) {
        console.log(`❌ ${file} does not exist`);
        return;
    }

    const sourceFile = getSourceFile(file);
    const full = resolve(`${SOURCE_DIR}${sep}${sourceFile}` as string);

    const resp = (await read(file)).toString().split(/\r?\n/g);
    // console.log(resp.length)

    const statementMap: StatementMap = {};
    const s: S = {};

    for (let i = 0; i < resp.length; i++) {
        if (resp[i] === "") continue;
        const values = resp[i].split(',');
        // console.log(values.length)
        statementMap[i] = {

            // TODO(Kelosky): do end columns
            start: {
                line: parseInt(values[0], 10),
                column: 1
            },
            end: {
                line: parseInt(values[0], 10),
                column: null
            }
        };
        s[i] = parseInt(values[2], 10);

    }


    const branchMap: BranchMap = {};
    const fnMap: FunctionMap = {};
    const b: B = {};
    const f: F = {};
    const entries: Entries = {};

    entries[full] = {
        statementMap,
        path: full,
        branchMap,
        fnMap,
        s,
        f,
        b
    }

    // resp.machineRecords.map( (val) => val.instruction = Buffer.from(val.instruction) );
    // resp.machineRecords.map( (val) => val.instruction = Buffer.from(val.instruction) );

    // console.log(entries)

    await write(`${COVERAGE_DIR}/${COVERAGE_FILE}`, JSON.stringify(entries, null, JSON_INDENT));
    console.log(`... wrote ${COVERAGE_DIR}/${COVERAGE_FILE}`);
}

function getSourceFile(coverageFile: string) {
    const base = basename(coverageFile);
    if (base.indexOf(COVERAGE_RESULTS_SUFFIX) > -1) {

        const file = base.substr(0, base.length - COVERAGE_RESULTS_SUFFIX.length);
        return file;

    } else {
        console.log(`❌ coverage file does not exit; need 'coverage\\<source>.s${COVERAGE_RESULTS_SUFFIX}'`);
    }

}