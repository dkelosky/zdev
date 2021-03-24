#! /bin/env node
import { runCmd } from "./utils"
import { ZOWE, TARGET_DIR } from "./constants"

(async () => {
    await make(TARGET_DIR);
})();

async function make(dir: string) {
    const makeCmd = `${ZOWE} uss issue ssh \\"cd ${dir} && make\\"`;
    const strResp = await runCmd(makeCmd);
    console.log(`... ${strResp}`);
}