import { Constants, ZOWE } from "../constants";
import { runCmd } from "../utils";

export function copyModule(module: string, dataset: string) {
    console.log(`Copying ${module} to ${dataset}...`)
    const dir = Constants.instance.taretZfsDirDeploy;
    const makeCmd = `${ZOWE} uss issue ssh "cd ${dir} && cp -X ${module} \\"//'${dataset.toUpperCase()}'\\" "`;
    const strResp = runCmd(makeCmd);

    if (strResp) {
        console.log(`...${strResp}`);
        // if (getListing) {
        //     const listings = await getListings(strResp);
        //     await downloadListingFiles(listings);
        // }
    } else {
        console.log(`⚠️  unknown copy status\n`);
        return false;
    }
}