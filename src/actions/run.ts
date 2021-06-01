import { runCmd, getListings } from "../utils"
import { Constants, ZOWE } from "../constants"
import { downloadListingFiles } from "./download-zfs";

export async function run(target: string) {
    const dir = Constants.instance.taretZfsDirDeploy;
    const makeCmd = `${ZOWE} uss issue ssh \\"cd ${dir} && export _BPXK_JOBLOG=STDERR && ./${target}\\"`;

    const strResp = await runCmd(makeCmd);

    if (strResp) {
        console.log(`...${strResp}`);
        // const listings = await getListings(strResp);
        // await downloadListingFiles(listings);
    } else {
        console.log(`⚠️  unknown run status\n`);
        return false;
    }
}