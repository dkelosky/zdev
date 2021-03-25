import { exec } from "child_process";
import { promisify } from "util"

const exc = promisify(exec);

export async function runCmd(cmd: string, rfj = false) {
    cmd += (rfj) ? " --rfj" : ""

    let resp;
    try {
        resp = await exc(cmd);
        if (resp.stderr) {
            console.log(`❌  stderr:\n  ${resp.stderr}`);
        }
    } catch (err) {
        console.log(`❌  caught:\n${err}`);
    }
    return resp?.stdout || undefined;
}