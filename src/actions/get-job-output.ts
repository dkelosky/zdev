import { runCmd } from "../utils"
import { ZOWE, Constants } from "../constants"

export async function getLatestJobOutput() {
    let cmd = `${ZOWE} jobs list jobs"`;
    const strResp = await runCmd(cmd, true);

    if (strResp) {
        // console.log(`✔️  ${strResp}  - ${dsn}`);
        const jobs = JSON.parse(strResp);
        const latest = await getLatestOutputJob(jobs.data)

    } else {
        console.log(`⚠️  unknown job response\n`);
    }
    // console.log(`yippy`)
}


async function getLatestOutputJob(jobs: any[]) {

    let outputJobs = [];


    for (let i = 0; i < jobs.length; i++) {
        if (jobs[i].status === "OUTPUT") {
            outputJobs.push(jobs[i]);
        }
    }

    // let jesMsgJobs = [];
    for (let i = 0; i < outputJobs.length; i++) {

        const JESMSGLG_NUM = 2;
        let cmd = `${ZOWE} jobs view sfbi ${outputJobs[i].jobid} ${JESMSGLG_NUM}"`;
        const strResp = await runCmd(cmd,);

        if (strResp) {
            // console.log(`✔️  ${strResp}  - ${dsn}`);
            // const data = JSON.parse(strResp);
            console.log(strResp)
            // const latest = await getLatestOutputJob(jobs.data)

        } else {
            console.log(`⚠️  unknown sfbi response\n`);
        }

    }

}
