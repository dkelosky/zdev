import { ZOWE } from "../constants";
import { runCmd } from "../utils";

export async function purgeJobs() {
    let cmd = `${ZOWE} jobs list jobs"`;
    const strResp = await runCmd(cmd, true);

    if (strResp) {
        const jobs = JSON.parse(strResp).data;

        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];
            if (job.status === "OUTPUT") {
                const jobId = job.jobid;
                const cmd = `${ZOWE} jobs delete job ${jobId}`;
                const deleteResp = await runCmd(cmd, false);

                if (deleteResp) {
                    console.log(`${deleteResp}`);
                } else {
                    console.log(`✘  Error deleting ${jobId} `);
                }

            } else {
            }
        }

    } else {
        console.log(`⚠️  unknown job response\n`);
    }
}