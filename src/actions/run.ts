import { runCmd, getListings } from "../utils"
import { Constants, ZOWE } from "../constants"
import { downloadListingFiles } from "./download-zfs";

export async function run(target: string, steplib?: string[], parms?: string[]) {
    const dir = Constants.instance.taretZfsDirDeploy;

    let steplibEnv = "";
    let parmsJoined = parms?.join(" ") || "";

    if (steplib) {
        steplibEnv += `&& export STEPLIB=`;

        steplib.forEach((dsn, index) => {
            steplibEnv += dsn;
            if (index !== steplib.length - 1) {
                steplibEnv += ':'; // add delimiter for all but last
            }
        })
    }


    const makeCmd = `${ZOWE} uss issue ssh "cd ${dir} && export _BPXK_JOBLOG=STDERR ${steplibEnv} && ./${target} ${parmsJoined}"`;
    console.log(makeCmd)

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