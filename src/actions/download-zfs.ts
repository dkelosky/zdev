import { sep } from "path";
import { ADATA_SUFFIX, Constants, ZOWE } from "../constants";
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
    const source = `${Constants.instance.taretZfsDirDeploy}/${file}`.trim();
    const target = `${Constants.instance.listingDir}/${file}`.trim();

    let binary = "";
    if (file.indexOf(ADATA_SUFFIX) > -1) {
        binary = "--binary"
    }

    console.log(`Downloading "${source}" to "${target}"\n`);
    const downloadCmd = `${ZOWE} files download uf "${source}" --file ${target} ${binary}`;

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