#! /bin/env node
import { runCmd } from "../utils"
import { ZOWE, TARGET_ZFS_DIR_DEPLOY } from "../constants"

export async function make(target: string) {
    const dir = TARGET_ZFS_DIR_DEPLOY;
    const makeCmd = `${ZOWE} uss issue ssh \\"cd ${dir} && make ${target}\\"`;
    const strResp = await runCmd(makeCmd);
    console.log(`${strResp}`);
}