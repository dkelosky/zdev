import Mock = jest.Mock;
jest.mock("../../src/utils");

import { purgeJobs } from "../../src/actions/purge-jobs";
import { runCmd } from "../../src/utils";


const jobs = {
    "success": true,
    "exitCode": 0,
    "message": "List of jobs returned for prefix \"*\" and owner \"null\"",
    "stdout": "TSU00399 ABEND S222 IBMUSER  OUTPUT\nJOB00402 CC 0000    $$$$$$@  OUTPUT\nJOB00400 CC 0000    IBMUSER$ OUTPUT\nTSU00403            IBMUSER  ACTIVE\n",
    "stderr": "",
    "data": [
        {
            "owner": "IBMUSER",
            "phase": 20,
            "subsystem": "JES2",
            "phase-name": "Job is on the hard copy queue",
            "job-correlator": "T0000399SYS1DAMDD9F9A0A5.......:",
            "type": "TSU",
            "url": "https://mainframe.net:443/zosmf/restjobs/jobs/T0000399SYS1DAMDD9F9A0A5.......%3A",
            "jobid": "TSU00399",
            "class": "TSU",
            "files-url": "https://mainframe.net:443/zosmf/restjobs/jobs/T0000399SYS1DAMDD9F9A0A5.......%3A/files",
            "jobname": "IBMUSER",
            "status": "OUTPUT",
            "retcode": "ABEND S222"
        },
        {
            "owner": "IBMUSER",
            "phase": 20,
            "subsystem": "JES2",
            "phase-name": "Job is on the hard copy queue",
            "job-correlator": "J0000402SYS1DAMDD9F9A0D0.......:",
            "type": "JOB",
            "url": "https://mainframe.net:443/zosmf/restjobs/jobs/J0000402SYS1DAMDD9F9A0D0.......%3A",
            "jobid": "JOB00402",
            "class": "K",
            "files-url": "https://mainframe.net:443/zosmf/restjobs/jobs/J0000402SYS1DAMDD9F9A0D0.......%3A/files",
            "jobname": "$$$$$$@",
            "status": "OUTPUT",
            "retcode": "CC 0000"
        },
        {
            "owner": "IBMUSER",
            "phase": 20,
            "subsystem": "JES2",
            "phase-name": "Job is on the hard copy queue",
            "job-correlator": "J0000400SYS1DAMDD9F9A0BD.......:",
            "type": "JOB",
            "url": "https://mainframe.net:443/zosmf/restjobs/jobs/J0000400SYS1DAMDD9F9A0BD.......%3A",
            "jobid": "JOB00400",
            "class": "K",
            "files-url": "https://mainframe.net:443/zosmf/restjobs/jobs/J0000400SYS1DAMDD9F9A0BD.......%3A/files",
            "jobname": "IBMUSER$",
            "status": "OUTPUT",
            "retcode": "CC 0000"
        },
        {
            "owner": "IBMUSER",
            "phase": 14,
            "subsystem": "JES2",
            "phase-name": "Job is actively executing",
            "job-correlator": "T0000403SYS1DAMDD9F9A0F5.......:",
            "type": "TSU",
            "url": "https://mainframe.net:443/zosmf/restjobs/jobs/T0000403SYS1DAMDD9F9A0F5.......%3A",
            "jobid": "TSU00403",
            "class": "TSU",
            "files-url": "https://mainframe.net:443/zosmf/restjobs/jobs/T0000403SYS1DAMDD9F9A0F5.......%3A/files",
            "jobname": "IBMUSER",
            "status": "ACTIVE",
            "retcode": null
        }
    ]
};

describe("purge tests", () => {
    describe("purgeJobs tests", () => {
        it("should run purge without errors", async () => {

            const spy = jest.spyOn(console, "log").mockImplementation(() => { });

            const fn = (runCmd as any) as Mock<ReturnType<typeof runCmd>, Parameters<typeof runCmd>>;
            fn.mockImplementation(async (cmd, rfj) => {

                // const resp = jobs;
                return JSON.stringify(jobs);

            });

            const action = await purgeJobs();
            expect(spy).toHaveBeenCalledTimes(3); // three jobs are OUTPUT
        });

    });
});
