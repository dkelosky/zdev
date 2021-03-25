import { exec } from "child_process";
import { promisify } from "util"
import { readdir, exists, stat, mkdir, writeFile } from "fs";
import { sep } from "path";
import { CACHE_NAME, SOURCE_CACHE_DIR_NAME } from "./constants";

const exc = promisify(exec);
const stats = promisify(stat);
const exist = promisify(exists);
const write = promisify(writeFile);
const mdir = promisify(mkdir);
const readDir = promisify(readdir);

export async function runCmd(cmd: string, rfj = false) {
    cmd += (rfj) ? " --rfj" : ""

    let resp;
    try {
        resp = await exc(cmd);
        if (resp.stderr) {
            console.log(`❌  stderr:\n  ${resp.stderr}`);
        }
    } catch (err) {
        console.log(`❌  caught:\n${err}`);
    }
    return resp?.stdout || undefined;
}

export async function getChanged(): Promise<string[]> {
    createCacheDirs();
    const files = await getDirFiles(`${SOURCE_CACHE_DIR_NAME}`);



    return files;
}

// export async function getCwdFiles(dir: string) {
//     const dir = `${process.cwd()}${sep}${SOURCE_DIR}`;

//     if (await exist(dir)) {
//         let files = await readDir(`${process.cwd()}${sep}${SOURCE_DIR}`);
//         return files.map((file) => `${SOURCE_DIR}${sep}${file}`)
//     } else {
//         console.log(`⚠️ '${dir}' does not exist\n`);
//         return [];
//     }
// }

export async function getDirFiles(dir: string) {

    if (await exist(dir)) {
        let files = await readDir(`${process.cwd()}${sep}${dir}`);
        return files.map((file) => `${dir}/${file}`)
    } else {
        console.log(`⚠️ '${dir}' does not exist\n`);
        return [];
    }
}

// async function getCwdFiles() {
//     const dir = `${process.cwd()}${sep}${SOURCE_DIR}`;

//     if (await exist(dir)) {
//         let files = await readDir(`${process.cwd()}${sep}${SOURCE_DIR}`);
//         return files.map((file) => `${SOURCE_DIR}${sep}${file}`)
//     } else {
//         console.log(`⚠️ '${dir}' does not exist\n`);
//         return [];
//     }
// }

export async function updateCache(file: string) {
    createCacheDirs();

    // for (let i = 0; i < files.length; i++) {
    console.log(`writting ${file}`)
    const st = await stats(file);
    if (st.isFile()) {
        await write(`${CACHE_NAME}${sep}${file}`, JSON.stringify(st, null, 4));
    } else {
        // TODO(Kelosky): logging to get current line
        console.log(`⚠️ '${file}' does not exist.`)
    }
    // }
}

async function createCacheDirs() {
    if (! await (exist(CACHE_NAME))) {
        await mdir(CACHE_NAME);
    }

    if (! await (exist(SOURCE_CACHE_DIR_NAME))) {
        await mdir(SOURCE_CACHE_DIR_NAME);
    }
}