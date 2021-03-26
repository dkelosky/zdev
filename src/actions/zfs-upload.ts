import { runCmd, updateCache, getDirFiles, getChanged } from "../utils"
import { ZOWE, TARGET_ZFS_DIR, SOURCE_DIR } from "../constants"
import { readdir, exists, stat } from "fs";
import { sep } from "path";
import { promisify } from "util"

const readDir = promisify(readdir);
const exist = promisify(exists);

// TODO(Kelosky): sync, e.g. delete remote files if gone from local

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
    if (files.length > 0) {

        for (let i = 0; i < files.length; i++) {
            if (await exist(files[i])) {
                await upload(files[i]);
            } else {
                console.log(`⚠️ '${files[i]}' does not exist.`)
            }
        }
    } else {
        console.log(`📝 ... nothing to upload!`);
    }
}


async function upload(file: string) {
    const target = `${TARGET_ZFS_DIR}/${file}`;

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
