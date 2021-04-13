import { runCmd, getListings } from "../utils"
import { ZOWE, TARGET_ZFS_DIR_DEPLOY } from "../constants"
import { downloadListingFiles } from "./download-zfs";

export async function make(target: string) {
    const dir = TARGET_ZFS_DIR_DEPLOY;
    const makeCmd = `${ZOWE} uss issue ssh \\"cd ${dir} && make ${target}\\"`;
    const strResp = await runCmd(makeCmd);

    if (strResp) {
        console.log(`...${strResp}`);
        const listings = await getListings(strResp);
        await downloadListingFiles(listings);
    }
}