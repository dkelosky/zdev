#! /bin/env node
import { runCmd } from "../utils"
import { ZOWE, TARGET_ZFS_DIR } from "../constants"

(async () => {
    await make(TARGET_ZFS_DIR);
})();

async function make(dir: string) {
    const makeCmd = `${ZOWE} uss issue ssh \\"cd ${dir} && make\\"`;
    const strResp = await runCmd(makeCmd);
    console.log(`... ${strResp}`);
}