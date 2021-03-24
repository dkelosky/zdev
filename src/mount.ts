import { runCmd } from "./utils"
import { ZOWE} from "./constants"

export async function mountZfs(zfs: string, dir: string) {
    const mountCmd = `${ZOWE} files mount fs ${zfs} '${dir}' -m rdwr`;

    let mounted = await isMounted(zfs, dir);

    if (!mounted) {
        console.log(`Mounting ZFS "${zfs}" to "${dir}"`);
        let strResp = await runCmd(mountCmd);
        console.log(`... ${strResp}`);
    }
}

export async function isMounted(zfs: string, dir: string) {
    const listCmd = `${ZOWE} uss issue ssh 'df "${dir}"'`;

    console.log(`Checking for mount...`);
    let strResp = await runCmd(listCmd, true);
    const jsonResp = JSON.parse(strResp);

    const lines: string[] = jsonResp.stdout.split(/\r?\n/);

    let mounted = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf(`${zfs}`) > -1) {
            mounted = true;
            break;
        }
    }

    if (mounted) {
        console.log(`... ${dir} is mounted`);
    } else {
        console.log(`... ${dir} is not mounted`);
    }

    return mounted;
}