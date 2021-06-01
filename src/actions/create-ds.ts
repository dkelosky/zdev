import { runCmd } from "../utils"
import { ZOWE, ZFS, dataSets, HLQ, QUAL, project, DSN_PATTERN } from "../constants"

export async function createDataSets() {

    Object.keys(dataSets).forEach(async (key) => {

        let dsn = `"${DSN_PATTERN}${key}"`;

        let cmd = `zowex files create pds ` +
            `"${dsn}`;

        if (dataSets[key].blockSize) cmd += ` --bs ${dataSets[key].blockSize}`;
        if (dataSets[key].directoryBlocks) cmd += ` --db ${dataSets[key].directoryBlocks}`;
        if (dataSets[key].recordFormat) cmd += ` --rf ${dataSets[key].recordFormat}`;
        if (dataSets[key].dataSetType) cmd += ` --dst ${dataSets[key].dataSetType}`;
        if (dataSets[key].recordLength) cmd += ` --rl ${dataSets[key].recordLength}`;
        if (dataSets[key].size) cmd += ` --sz ${dataSets[key].size}`;
        if (dataSets[key].volumeSerial) cmd += ` --vs ${dataSets[key].volumeSerial}`;

        // TODO(Kelosky): add delete options
        if (await pdsExists(dsn)) {
            console.log(`... ${dsn} already exists`);
        } else {
            //   console.log(`Creating directory ${dsn}...`);
            const strResp = await runCmd(cmd);
            if (strResp) {
                console.log(`✔️  ${strResp} - ${dsn}`);
                return true;
            } else {
                console.log(`⚠️  unknown mkdir status\n`);
                return false;

            }

        }
        // console.log(`command ${cmd}`)
    });
    // TODO(Kelosky): does it exist

    // const mkdirCmd = `${ZOWE} uss issue ssh 'mkdir -p "${dir}"'`;

    // if (strResp) {
    //     console.log(`✔️  ${strResp}`);
    //     return true;
    // } else {
    //     console.log(`⚠️  unknown mkdir status\n`);
    //     return false;
    // }

}

async function pdsExists(dsn: string) {
    let cmd = `zowex files list ds ` +
        `"${dsn}`;
    const strResp = await runCmd(cmd, true);


    if (strResp) {
        const jsonResp = JSON.parse(strResp);

        if (jsonResp.data.apiResponse.items.length > 0)
            // console.log(`✔️  ${strResp}`);
            return true;
    } else {
        console.log(`⚠️  unknown exist status\n`);
        return false;

    }
}
