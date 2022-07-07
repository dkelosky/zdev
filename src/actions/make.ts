import { runCmd, getListings } from "../utils"
import { ZOWE, Constants } from "../constants"
import { downloadListingFiles } from "./download-zfs";

// TODO(Kelosky): if errors then end non-zero
export function make(target: string, getListing = true) {
    const dir = Constants.instance.taretZfsDirDeploy;
    const makeCmd = `${ZOWE} uss issue ssh "cd ${dir} && make ${target}"`;
    const strResp = runCmd(makeCmd);

    const asmaRegex = new RegExp(/.*ASMA\d\d\d[E|W|S].*/g);
    const bindRegex = new RegExp(/.*IEW\d\d\d\d[E|W|S].*/g);
    const errRegex = new RegExp(/.*ERROR.*/g);
    const warnRegex = new RegExp(/.*WARNING.*/g);

    if (strResp) {
        console.log(`...${strResp}`);
        if (getListing) {
            const listings = getListings(strResp);
            downloadListingFiles(listings);
        }
        if (asmaRegex.test(strResp))
        {
            console.log(`❌ stopping for HLASM warn/error condition`)
            process.exit(1);
        }
        if (bindRegex.test(strResp))
        {
            console.log(`❌ stopping for binder warn/error condition`)
            process.exit(1);
        }
        if (errRegex.test(strResp))
        {
            console.log(`❌ stopping for error condition`)
            process.exit(1);
        }
        if (warnRegex.test(strResp)) {
            console.log(`⚠️ stopping for warning condition`)
            process.exit(1);
        }
    } else {
        console.log(`⚠️  unknown make status\n`);
        return false;
    }
}