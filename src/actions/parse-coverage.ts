import { promisify, inspect } from "util"
import { readdir, exists, stat, mkdir, writeFile, readFile, Stats, unlink, Dirent, } from "fs";
import { WORK_COVERAGE_DIR, COVERAGE_FILE, COVERAGE_RESULTS_SUFFIX, JSON_INDENT, SOURCE_DIR, COVERAGE_ADATA_SUFFIX, COVERAGE_DIR } from "../constants";
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
import { SourceAnalysisRecord } from "./doc/adata/SourceAnalysisRecord";

const stats = promisify(stat);
const read = promisify(readFile);
const write = promisify(writeFile);
const mdir = promisify(mkdir);

// https://github.com/gotwarlost/istanbul/blob/master/coverage.json.md

// TODO(Kelosky): read in ADATA and send to z/OS data set to be read by zcov
// TODO(Kelosky): this method should download output
export async function parseCoverage(file: string) {

    console.log(`⚠️  This command probably does not belong here`);

    const resultsFile = `${WORK_COVERAGE_DIR}${sep}${file}${COVERAGE_RESULTS_SUFFIX}`;
    const adataFile = `${WORK_COVERAGE_DIR}${sep}${file}${COVERAGE_ADATA_SUFFIX}`;
    console.log(`For file ${file}, reading ${resultsFile} and ${adataFile}`)

    try {
        await stats(COVERAGE_DIR);
    } catch (err) {
        await mdir(COVERAGE_DIR);
    }

    try {
        await stats(resultsFile)
    } catch (err) {
        console.log(`❌ ${resultsFile} does not exist, download zcov report to .zdev\\coverage\\<source>.s.results.txt`);
        return;
    }

    try {
        await stats(adataFile)
    } catch (err) {
        console.log(`❌ ${adataFile} does not exist, run 'zdev parse-adata'`);
        return;
    }

    const sourceFile = getSourceFile(resultsFile);
    const full = resolve(`${SOURCE_DIR}${sep}${sourceFile}` as string);

    const adata: Adata = JSON.parse((await read(adataFile)).toString());
    const resp = (await read(resultsFile)).toString().split(/\r?\n/g);

    const statementMap: StatementMap = {};
    const s: S = {};

    for (let i = 0; i < resp.length; i++) {
        if (resp[i] === "") continue;
        const values = resp[i].split(',');

        const statement = parseInt(values[0], 10);

        // let skip = false;
        let sourceAnalysisRec: SourceAnalysisRecord | null = null;
        // look at sourceAnalysisRecords and find matching statement
        for (let j = 0; j < adata.sourceAnalysisRecords.length; j++) {
            if (statement === adata.sourceAnalysisRecords[j].statementNumber) {
                // if (adata.sourceAnalysisRecords[j].parentRecordOrigin) {
                sourceAnalysisRec = adata.sourceAnalysisRecords[j];
                // skip = true;
                break;
                // }
            }
        }

        if (sourceAnalysisRec?.parentRecordNumber === 0) {
            // console.log(`it is ${sourceAnalysisRec?.parentRecordNumber}`)
            statementMap[i] = {
                // TODO(Kelosky): do end columns

                start: {
                    line: sourceAnalysisRec?.inputRecordNumber,
                    // line: parseInt(values[0], 10),
                    column: 1
                },
                end: {
                    // line: parseInt(values[0], 10),
                    line: sourceAnalysisRec?.inputRecordNumber,
                    // line: parseInt(values[0], 10),
                    column: null
                }
            };
            s[i] = parseInt(values[2], 10);
        } else {
        }

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

    await write(`${COVERAGE_DIR}${sep}${COVERAGE_FILE}`, JSON.stringify(entries, null, JSON_INDENT));
    console.log(`... wrote ${COVERAGE_DIR}${sep}${COVERAGE_FILE}`);
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