import { exec } from "child_process";
import { promisify } from "util"

const exc = promisify(exec);

export async function runCmd(cmd: string, rfj = false) {
    cmd += (rfj) ? " --rfj" : ""
    const resp = await exc(cmd);
    if (resp.stderr) {
        throw new Error(resp.stderr);
    }
    return resp.stdout;
}