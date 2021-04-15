import { runCmd } from "../utils"
import { ZOWE, ZFS } from "../constants"

export async function createDirs(dir: string) {
    console.log(`Creating directory "${dir}"...`);
    const mkdirCmd = `${ZOWE} uss issue ssh 'mkdir -p "${dir}"'`;
    const strResp = await runCmd(mkdirCmd);
    console.log(`✔️  ${strResp}`);
}

export async function creatZfs(zfs: string) {
    const listCmd = `${ZOWE} files list ds "${ZFS}"`;
    const createCmd = `${ZOWE} files create zfs "${ZFS}"`;

    // TODO(Kelosky): support volumes
    // TODO(Kelosky): support size
    const volumes = `--volumes `

    console.log(`Checking for ZFS "${zfs}"...`);
    let strResp = await runCmd(listCmd, true);

    if (strResp) {

        const jsonResp = JSON.parse(strResp);

        if (jsonResp.data.apiResponse.returnedRows === 0) {
            strResp = await runCmd(createCmd);
            console.log(`✔️  ... ${strResp}\n`);
        } else {
            console.log(`✔️  ... data set already exists\n`);
        }
    } else {
        console.log(`⚠️  unknown listing status\n`);
        return false;
    }
}
