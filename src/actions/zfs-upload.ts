import { runCmd, updateCache, getDirFiles, getChanged } from "../utils"
import { ZOWE, SOURCE_DIR, Constants, HLASM_MACRO_SUFFIX } from "../constants"
import { readdir, exists, stat } from "fs";
import { sep, extname } from "path";
import { promisify } from "util"
import { dirname, basename } from "path";

const readDir = promisify(readdir);
const exist = promisify(exists);
const stats = promisify(stat);

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

    const reg = new RegExp(/__\S+__/g);

    if (files.length > 0) {

        for (let i = 0; i < files.length; i++) {

            if ((await stats(files[i])).isDirectory()) {
                // do nothing
            } else {
                if (await exist(files[i])) {

                    if (reg.test(files[i])) {
                        console.log(`📝 ... skipping underscore upload '${files[i]}'`)
                        await updateCache(files[i]);
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
            await updateCache(file);
            console.log(`✔️  ... complete!`)
        }
    } else {
        console.log(`⚠️  unknown upload status\n`);
        return false;
    }

}
