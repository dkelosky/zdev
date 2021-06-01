import { runCmd } from "../utils";
import { ZOWE, Constants } from "../constants";
import { isMounted } from "./mount";

export async function unmount(zfs: string) {

    let mounted = await isMounted(Constants.instance.zfs, Constants.instance.targetZfsDir);
    if (mounted) {
        console.log(`Unmounting "${zfs}"...`);
        const unmountCmd = `${ZOWE} files unmount fs "${zfs}"`;
        try {
            const strResp = await runCmd(unmountCmd);

            if (strResp) {
                console.log(`✔️  ${strResp}`);

            } else {
                console.log(`⚠️  unknown unmount status\n`);
                return false;
            }

        } catch (err) {
            console.log(err)
        }
    }

}
