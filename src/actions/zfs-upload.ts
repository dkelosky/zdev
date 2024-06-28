import { runCmd, getDirFiles, getDirs } from "../utils"
import { ZOWE, SOURCE_DIR, Constants, HLASM_MACRO_SUFFIX, UNDERSCORE, CACHE_NAME, CACHE_SUFFIX, JSON_INDENT, SOURCE_CACHE_DIR_NAME } from "../constants"
import { sep, extname } from "path";
import { readdir, exists, stat, mkdir, writeFile, readFile, Stats, unlink, Dirent } from "fs";
import { promisify } from "util"
import { dirname, basename } from "path";


const stats = promisify(stat);
const exist = promisify(exists);
const write = promisify(writeFile);
const mdir = promisify(mkdir);
const readDir = promisify(readdir);
const del = promisify(unlink);
const read = promisify(readFile);

interface IExtStats extends Stats {
    used: boolean;
}

// TODO(Kelosky): sync, e.g. delete remote files if gone from local
// TODO(Kelosky): delete remote dirs if gone from local

export async function uploadAll() {
    const files = await getDirFiles(`${SOURCE_DIR}`);
    return doUploads(files);
}

export async function uploadFiles(files: string[]) {
    files = files.map((file) => `${SOURCE_DIR}/${file}`);
    return doUploads(files);
}

export async function uploadChanged() {
    const files = await getChanged();
    if (files.length === 0) {
        console.log(`Files already synced...`);
    }
    return doUploads(files);
}

async function doUploads(files: string[]) {

    const reg = new RegExp(UNDERSCORE);

    if (files.length > 0) {

        for (let i = 0; i < files.length; i++) {

            if ((await stats(files[i])).isDirectory()) {
                // do nothing
            } else {
                if (await exist(files[i])) {

                    if (reg.test(files[i])) {
                        console.log(`📝 ... skipping underscore upload '${files[i]}'`)
                        await updateCached(files[i]);
                    } else {
                        await upload(files[i]);
                    }

                } else {
                    console.log(`⚠️ '${files[i]}' does not exist.`)
                }
            }

        }
    } else {
        console.log(`📝 ... nothing to upload!`);
    }
}


async function upload(file: string) {

    let target = `${Constants.instance.targetZfsDir}/${file}`;
    console.log(extname(file))
    if (extname(file) === HLASM_MACRO_SUFFIX) {

        const dir = dirname(file);
        const ext = extname(file);
        const base = basename(file, ext);
        target = `${Constants.instance.targetZfsDir}/${dir}/${base.toUpperCase()}`;
    }

    const uploadCmd = `${ZOWE} files upload ftu "${file}" "${target}"`;
    console.log(`Uploading "${file}" to "${target}"`);

    const strResp = await runCmd(uploadCmd, true);

    if (strResp) {
        const jsonResp = JSON.parse(strResp);

        if (!jsonResp.success) {
            console.log(jsonResp.error.msg)
            console.log(jsonResp.error.additionalDetails)
            console.log(`Try running "${uploadCmd}" for more information`);

            // TODO(Kelosky): record failed and allow redrive

        } else {
            await updateCached(file);
            console.log(`✔️  ... complete!`)
        }
    } else {
        console.log(`⚠️  unknown upload status\n`);
        return false;
    }

}

async function getChanged(): Promise<string[]> {
    await createCachedDirs();

    const cacheFiles = await getDirFiles(`${SOURCE_CACHE_DIR_NAME}`);
    const files = await getDirFiles(`${SOURCE_DIR}`);

    // console.log(cacheFiles)
    // console.log(files)

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

async function updateCached(file: string) {
    await createCachedDirs();

    const st = await stats(file);
    if (st.isFile()) {
        // console.log(st)
        await write(`${CACHE_NAME}${sep}${file}${CACHE_SUFFIX}`, JSON.stringify(st, null, JSON_INDENT));
    } else {
        // TODO(Kelosky): logging to get current line
        console.log(`⚠️ '${file}' does not exist.`)
    }
}

async function createCachedDirs() {
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