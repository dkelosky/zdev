import { runCmd } from "../utils"
import { ZOWE, Constants } from "../constants"

export async function createDirs(dir: string) {
    console.log(`Creating directory "${dir}"...`);
    const mkdirCmd = `${ZOWE} uss issue ssh 'mkdir -p "${dir}"'`;
    const strResp = await runCmd(mkdirCmd);

    if (strResp) {
        console.log(`✔️  ${strResp}`);
        return true;
    } else {
        console.log(`⚠️  unknown mkdir status\n`);
        return false;
    }

}

export async function creatZfs(zfs: string) {
    const listCmd = `${ZOWE} files list ds "${Constants.instance.zfs}"`;
    const createCmd = `${ZOWE} files create zfs "${Constants.instance.zfs}"`;

    // TODO(Kelosky): support volumes
    // TODO(Kelosky): support size
    const volumes = `--volumes `

    console.log(`Checking for ZFS "${zfs}"...`);
    let strResp = await runCmd(listCmd, true);

    if (strResp) {

        const jsonResp = JSON.parse(strResp);

        if (jsonResp.data.apiResponse.returnedRows === 0) {

            console.log(`Creating ZFS "${zfs}"...`);

            strResp = await runCmd(createCmd);

            if (strResp) {
                console.log(`✔️  ... ${strResp}\n`);
            } else {
                console.log(`⚠️  unknown create status\n`);
                return false;
            }

        } else {
            console.log(`✔️  ... data set already exists\n`);
        }
    } else {
        console.log(`⚠️  unknown listing status\n`);
        return false;
    }

    return true;
}
