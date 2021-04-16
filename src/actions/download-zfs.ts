import { sep } from "path";
import { LISTING_DIR, TARGET_ZFS_DIR_DEPLOY, ZOWE } from "../constants";
import { runCmd } from "../utils";

export async function downloadListingFiles(files: string[]) {
    if (files.length > 0) {

        for (let i = 0; i < files.length; i++) {
            await download(files[i]);
        }
    } else {
        console.log(`📝 ... nothing to download!`);
    }
}

async function download(file: string) {
    const source = `${TARGET_ZFS_DIR_DEPLOY}/${file}`.trim();
    const target = `${LISTING_DIR}/${file}`.trim();

    const downloadCmd = `${ZOWE} files download uf "${source}" --file ${target}`;

    const strResp = await runCmd(downloadCmd, true);

    if (strResp) {
        const jsonResp = JSON.parse(strResp);

        if (!jsonResp.success) {
            console.log(jsonResp.error.msg)
            console.log(jsonResp.error.additionalDetails)
            console.log(`Try running "${downloadCmd}" for more information`);

        } else {
            console.log(`✔️  ... complete!`)
        }
    } else {
        console.log(`⚠️  unknown download status\n`);
        return false;
    }

}