import { promisify, inspect } from "util"
import { readdir, exists, stat, mkdir, writeFile, readFile, Stats, unlink, Dirent } from "fs";
import { COVERAGE_DIR } from "../constants";
import { sep } from "path";
import { Adata } from "./doc/Adata";

const stats = promisify(stat);
const read = promisify(readFile);

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

    const resp: Adata = JSON.parse((await read(file)).toString());

    // resp.machineRecords.map( (val) => val.instruction = Buffer.from(val.instruction) );
    // resp.machineRecords.map( (val) => val.instruction = Buffer.from(val.instruction) );

    console.log(resp)
}