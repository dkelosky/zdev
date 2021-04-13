import { exec } from "child_process";
import { promisify, inspect } from "util"
import { readdir, exists, stat, mkdir, writeFile, readFile, Stats, unlink } from "fs";
import { sep, dirname } from "path";
import { CACHE_NAME, CACHE_SUFFIX, LISTING_SUFFIX, SOURCE_CACHE_DIR_NAME, SOURCE_DIR } from "./constants";

interface IExtStats extends Stats {
    used: boolean;
}

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
 *  $ cd /tmp/kelda16/make/zossrc && make mtlmain
 *  xlc -S -W "c,metal, langlvl(extended), sscom, nolongname, inline, genasm, inlrpt, csect, nose, lp64, list, warn64, optimize(2), list, showinc, showmacro, source, aggregate" -qlist=mtlmain.mtl.lst -I/usr/include/metal -o mtlmain.s mtlmain.cas  -a=mtlmain.asm.lst -o mtlmain.o mtlmain.s
 *  Assembler Done No Statements Flagged
 *  ld -bRMODE=ANY -V -eMAIN -o mtlmain mtlmain.o > mtlmain.bind.lst
 *  IEW2278I B352 INVOCATION PARAMETERS -
 *          TERM=YES,PRINT=NO,MSGLEVEL=4,STORENX=NEVER,RMODE=ANY,LIST=NOIMP,XREF=
 *          YES,MAP=YES,PRINT=YES,MSGLEVEL=0
 *  IEW2008I 0F03 PROCESSING COMPLETED.  RETURN CODE =  0.
 */
export async function getListings(text: string): Promise<string[]> {

    const files: string[] = [];

    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf(LISTING_SUFFIX) > -1) {
            const words = lines[i].split(' ');

            for (let j = 0; j < words.length; j++) {

                if (words[j].indexOf(LISTING_SUFFIX) > -1) {
                    const parts = words[j].split(`=`);

                    // if divided on an equal sign, e.g. -a=main.asm.lst
                    if (parts.length === 2) {
                        files.push(parts[1]);
                        break;
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

export async function getChanged(): Promise<string[]> {
    await createCacheDirs();

    const cacheFiles = await getDirFiles(`${SOURCE_CACHE_DIR_NAME}`);
    const files = await getDirFiles(`${SOURCE_DIR}`);

    console.log(cacheFiles)
    console.log(files)

    // prefix in cache directory, needed for reading from disk, but both maps accept same key, e.g. zossrc/main.s
    const trim = `${CACHE_NAME}${sep}`;

    let changedFiles: string[] = [];
    let outDatedCache: string[] = [];

    if (cacheFiles.length === 0) return files;

    const cacheMap = new Map<string, IExtStats>();
    const filesMap = new Map<string, Stats>();

    // map of cache file names, e.g. zossrc/main.s and fs.stat
    for (let i = 0; i < cacheFiles.length; i++) {

        // read and parse
        const st = (await read(cacheFiles[i])).toString();
        const parsedSt = JSON.parse(st);

        // make the key match file key by stripping off .zowe-zos-dev prefix and trailing .json suffix
        const key = cacheFiles[i].substring(trim.length, cacheFiles[i].length - CACHE_SUFFIX.length)

        // insert
        cacheMap.set(key, parsedSt);
    }

    // map of current file names, e.g. zossrc/main.s and fs.stat
    for (let i = 0; i < files.length; i++) {
        const st = await stats(files[i]);
        filesMap.set(files[i], st);
    }

    // run through files in the project
    filesMap.forEach((val, key) => {

        // if not in cache, it needs uploaded
        if (!cacheMap.has(key)) {
            changedFiles.push(key);

            // else in cache, check timestamps
        } else {

            const cacheSt = cacheMap.get(key);

            // mark each cache file if used so we can prune those that are out of date
            cacheSt!.used = true;

            // if timestamp doesnt match, it needs uploaded
            if (val.mtimeMs !== cacheSt?.mtimeMs) {
                changedFiles.push(key);
            }
        }
    });

    // identify cache files that are no longer in the project
    cacheMap.forEach((val, key) => {
        if (!val.used) {
            outDatedCache.push(key);
        }
    });

    // delete outdate cache
    for (let i = 0; i < outDatedCache.length; i++) {

        // TODO(Kelosky): delete on z/OS side
        await del(`${trim}${outDatedCache[i]}${CACHE_SUFFIX}`);
    }

    return changedFiles;
}

/**
 *
 * @param dir From a directory, like `zossrc`, get all files recursively under that directory
 * @returns
 */
export async function getDirFiles(dir: string) {

    if (await exist(dir)) {
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

export async function updateCache(file: string) {
    await createCacheDirs();


    const st = await stats(file);
    if (st.isFile()) {
        // console.log(st)
        await write(`${CACHE_NAME}${sep}${file}${CACHE_SUFFIX}`, JSON.stringify(st, null, 4));
    } else {
        // TODO(Kelosky): logging to get current line
        console.log(`⚠️ '${file}' does not exist.`)
    }
}

async function createCacheDirs() {
    if (!(await exist(CACHE_NAME))) {
        await mdir(CACHE_NAME);
    }

    if (!(await exist(SOURCE_CACHE_DIR_NAME))) {
        await mdir(SOURCE_CACHE_DIR_NAME);
    }

    const dirs = await getDirs(SOURCE_DIR);

    for (let i = 0; i < dirs.length; i++) {

        if (!(await exist(`${CACHE_NAME}${sep}${dirs[i]}`)))
        await mdir(`${CACHE_NAME}${sep}${dirs[i]}`)
    }
}