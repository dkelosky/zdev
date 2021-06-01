import { runCmd } from "../utils"
import { ZOWE, Constants } from "../constants"

export async function createDataSets() {

    const dataSets = Constants.instance.dataSets;
    Object.keys(dataSets).forEach(async (key) => {

        let dsn = `${Constants.instance.dsnPattern}${key}`;
        let cmd = `${ZOWE} files create pds \\\"${dsn}\\\"`;

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
            const strResp = await runCmd(cmd);
            if (strResp) {
                console.log(`✔️  ${strResp}  - ${dsn}`);
                return true;
            } else {
                console.log(`⚠️  unknown mkdir status\n`);
                return false;

            }

        }
    });

}

async function pdsExists(dsn: string) {
    let cmd = `${ZOWE} files list ds \\\"${dsn}\\\"`;
    const strResp = await runCmd(cmd, true);


    if (strResp) {
        const jsonResp = JSON.parse(strResp);

        if (jsonResp.data.apiResponse.items.length > 0)
            return true;
    } else {
        console.log(`⚠️  unknown exist status\n`);
        return false;

    }
}
