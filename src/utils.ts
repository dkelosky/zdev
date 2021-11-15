import { exec } from "child_process";
import { promisify } from "util"
import { readdir, exists, stat, mkdir, writeFile, readFile, Stats, unlink, Dirent } from "fs";
import { sep } from "path";
import { ADATA_SUFFIX, CACHE_NAME, CACHE_SUFFIX, JSON_INDENT, LISTING_SUFFIX, SOURCE_CACHE_DIR_NAME, SOURCE_DIR, STATE } from "./constants";

const exc = promisify(exec);
const stats = promisify(stat);
const exist = promisify(exists);
const write = promisify(writeFile);
const mdir = promisify(mkdir);
const readDir = promisify(readdir);
const del = promisify(unlink);
const read = promisify(readFile);

/**
 *
 */
export async function getListings(text: string): Promise<string[]> {

    const files: string[] = [];

    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf(LISTING_SUFFIX) > -1 || lines[i].indexOf(ADATA_SUFFIX) > -1) {
            if (lines[i].indexOf("rm -f") > -1) {
                continue;
            }
            const words = lines[i].split(' ');

            for (let j = 0; j < words.length; j++) {

                if (words[j].indexOf(LISTING_SUFFIX) > -1 || words[j].indexOf(ADATA_SUFFIX) > -1) {
                    const parts = words[j].split(`=`);

                    // if divided on an equal sign, e.g. -a=main.asm.lst
                    if (parts.length === 2) {
                        files.push(parts[1]);
                    } else {

                        files.push(parts[0]);
                    }
                }
            }

        }
    }

    return files;

}

export async function runCmd(cmd: string, rfj = false) {
    cmd += (rfj) ? " --rfj" : ""

    if (STATE.debug) {
        console.log(`📢[DEBUG] - running '${cmd}'`)
    }

    let resp;
    try {
        resp = await exc(cmd);
        if (resp.stderr) {
            console.log(`❌  stderr:\n  ${resp.stderr}`);
        }
    } catch (err) {

        try {

            if (cmd.indexOf(`--rfj`) > -1) {
                const parsed = JSON.parse(err.stdout);
                console.log(`❌  caught parsed:\n${parsed.stderr}`);
            } else {
                console.log(`❌  caught unparsed:\n${err?.stdout}\n${err?.stderr}`)
            }
        } catch (innerErr) {
            console.log(`❌  caught:\n${err}`);
        }

    }
    return resp?.stdout || undefined;
}


/**
 *
 * @param dir From a directory, like `zossrc`, get all files recursively under that directory
 * @returns
 */
export async function getDirFiles(dir: string) {

    if (await exist(dir)) {
        // TODO(Kelosky): option to use fileTypes and skip stat call
        let files = await readDir(`${process.cwd()}${sep}${dir}`);
        files = files.map((file) => `${dir}/${file}`)

        for (let i = 0; i < files.length; i++) {
            if ((await stats(files[i])).isDirectory()) {

                const newList = await getDirFiles(files[i]);
                files.push(...newList);
            }
        }

        // remove directories
        let finalList = [];
        for (let i = 0; i < files.length; i++) {
            const st = await stats(files[i])
            if (st.isFile()) {
                finalList.push(files[i]);
            }
        }

        return finalList;

    } else {
        console.log(`⚠️ '${dir}' does not exist\n`);
        return [];
    }
}

export async function getDirs(dir: string) {

    // TODO(Kelosky): ignore __chdr__ or underscore folder

    let files = await readDir(`${process.cwd()}${sep}${dir}`);
    files = files.map((file) => `${dir}/${file}`)

    let dirs = [dir];
    for (let i = 0; i < files.length; i++) {
        if ((await stats(files[i])).isDirectory()) {
            // console.log(`${files[i]} is directory`)
            const newList = await getDirs(files[i]);
            if (newList.length > 0) {
                dirs.push(...newList);
            }
        }
    }
    return dirs;
}
