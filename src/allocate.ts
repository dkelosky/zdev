#! /bin/env node

import { runCmd } from "./utils"
import { ZOWE, TARGET_DIR, ZFS } from "./constants"
import { mountZfs } from "./mount"

// (async () => {
//     await createDirs(TARGET_DIR);
//     await creatZfs(ZFS);
//     await mountZfs(ZFS, TARGET_DIR);
// })();

// export _BPXK_JOBLOG=STDERR

export async function createDirs(dir: string) {
    console.log(`Creating directory "${dir}"...`);
    const mkdirCmd = `${ZOWE} uss issue ssh 'mkdir -p "${dir}"'`;
    const strResp = await runCmd(mkdirCmd);
    console.log(`${strResp}`);
}

export async function creatZfs(zfs: string) {
    const listCmd = `${ZOWE} files list ds "${ZFS}"`;
    const createCmd = `${ZOWE} files create zfs "${ZFS}"`;

    const volumes = `--volumes `

    console.log(`Checking for ZFS "${zfs}"...`);
    let strResp = await runCmd(listCmd, true);
    const jsonResp = JSON.parse(strResp);

    if (jsonResp.data.apiResponse.returnedRows === 0) {
        strResp = await runCmd(createCmd);
        console.log(`... ${strResp}`);
    } else {
        console.log(`... data set already exists`);
    }
}
