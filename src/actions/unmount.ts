import { runCmd } from "../utils";
import { ZOWE, ZFS, TARGET_ZFS_DIR } from "../constants";
import { isMounted } from "./mount";

export async function unmount(zfs: string) {

    let mounted = await isMounted(ZFS, TARGET_ZFS_DIR);
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
