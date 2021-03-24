import { runCmd } from "./utils";
import { ZOWE, ZFS, TARGET_DIR } from "./constants";
import { isMounted } from "./mount";

(async () => {
    await unmount(ZFS);
})();

async function unmount(zfs: string) {

    let mounted = await isMounted(ZFS, TARGET_DIR);
    if (mounted) {
        console.log(`Unmounting "${zfs}"...`);
        const unmountCmd = `${ZOWE} files unmount fs "${zfs}"`;
        try {
            const strResp = await runCmd(unmountCmd);
            console.log(`${strResp}`);
        } catch (err) {
            console.log(err)
        }
    }

}
