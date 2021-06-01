import { runCmd, getListings } from "../utils"
import { ZOWE, Constants } from "../constants"
import { downloadListingFiles } from "./download-zfs";

export async function make(target: string) {
    const dir = Constants.instance.taretZfsDirDeploy;
    const makeCmd = `${ZOWE} uss issue ssh \\"cd ${dir} && make ${target}\\"`;
    const strResp = await runCmd(makeCmd);

    if (strResp) {
        console.log(`...${strResp}`);
        const listings = await getListings(strResp);
        await downloadListingFiles(listings);
    } else {
        console.log(`⚠️  unknown make status\n`);
        return false;
    }
}