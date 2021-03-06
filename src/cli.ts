#! /bin/env node

// import * as cmd from "commander";
// const cli = new cmd.Command();
import { createDirs, creatZfs } from "./actions/allocate-zfs";
import { init, updateSource, initUserConfig, reinit } from "./init";
import { purgeJobs } from "./actions/purge-jobs";
import { mountZfs } from "./actions/mount";
import { unmount } from "./actions/unmount";
import { uploadAll, uploadChanged, uploadFiles } from "./actions/zfs-upload"
import { version, command, parse, help, Command, description, option, program } from "commander";
import { CMD_NAME, SOURCE_DIR, STATE, Constants } from "./constants"
import { make } from "./actions/make";
import { getDirs, getListings, runCmd } from "./utils";
import { run } from "./actions/run";
import { createDataSets } from "./actions/create-ds";
import { getLatestJobOutput } from "./actions/get-job-output";
import { parseAdata } from "./actions/parse-adata";
import { parseCoverage } from "./actions/parse-coverage";
import { copyModule } from "./actions/copy-module";
import { endevorSync } from "./actions/endevor/sync";

// NOTE(Kelosky): zowex uss issue ssh \"cd /tmp/kelda16 && ls\"

// BPXBATCH - ZOA
// https://www.ibm.com/docs/en/zos/2.3.0?topic=functions-dynalloc-allocate-data-set
// https://www.ibm.com/docs/en/zos/2.2.0?topic=output-example-calling-bpxwdyn-from-c
// https://www.ibm.com/docs/en/zos/2.1.0?topic=descriptions-extattr-set-reset-display-extended-attributes-files
// https://www.ibm.com/docs/en/zos/2.1.0?topic=descriptions-exec-bpx1exc-bpx4exc-run-program

// TODO(Kelosky): download built .s files from metal c
// TODO(Kelosky): help with asmchdrs
// TODO(Kelosky): build command that can once per day allocate data sets and cache that info
// TODO(Kelosky): make should trigger allocate conditionally and upload if out of sync
// TODO(Kelosky): create tests on directory so things can be moved without breaking!!
// TODO(Kelosky): sync command to delete old files not needed
// TODO(Kelosky): add lib & init lib command so helper code can be shared with projects
// TODO(Kelosky): fallback for batch / JCL to build
// TODO(Kelosky): run via TSO command??

// TODO(Kelosky): https://stackoverflow.com/questions/14172455/get-name-and-line-of-calling-function-in-node-js

//DSECT4 EXEC PGM=CCNEDSCT,
//         PARM='&DPARM,SECT(ALL)',
//         MEMLIMIT=256M
//STEPLIB  DD  DISP=SHR,DSN=CEE.SCEERUN2
//         DD  DISP=SHR,DSN=CBC.SCCNCMP
//         DD  DISP=SHR,DSN=CEE.SCEERUN
//SYSADATA DD  DISP=SHR,DSN=KELDA16.PUBLIC.MTL.ADATA(IHAASCB)
//EDCDSECT DD  DISP=SHR,DSN=KELDA16.PUBLIC.MTL.CHDR(IHAASCB)
//SYSPRINT DD SYSOUT=*
//SYSOUT   DD SYSOUT=*

program.
    version(`0.0.1`)
description(`Example:\n` +
    `  ${CMD_NAME} init <name> -u kelda16\n` +
    `  ${CMD_NAME} allocate\n`
);
option(`-d, --debug`)

// process.env.ZOWE_USE_DAEMON = "false";

command(`init <project>`)
    .requiredOption(`-u, --user <name>`)
    .option(`-f, --force`)
    .description(`init a project`)
    .action(async (project: string, options: any, cmd: Command) => {
        await init(project, options.user, { force: options.force });
    });

command(`config`)
    .requiredOption(`-u, --user <name>`)
    .option(`-f, --force`)
    .description(`config a project`)
    .action(async (options: any, cmd: Command) => {
        await initUserConfig(options.user, { force: options.force });
    });

// TODO(Kelosky): force option
// TODO(Kelosky): prompt to replace if exists (e.g. makefile)
command(`update`)
    .description(`update a project`)
    .action(async () => {
        // await updateSource();
        await reinit();
    });

// TODO(Kelosky): for these test for user = IBMUSER
// TODO(Kelosky): test for z/osmf profile
// TODO(Kelosky): on fresh create zfs, clear cache if it exists
command(`allocate`)
    .description(`allocate zfs`)
    .action(async () => {

        if (!(await createDirs(Constants.instance.targetZfsDir))) return;
        // if (!(await createDirs(TARGET_ZFS_DIR))) return;
        if (!(await creatZfs(Constants.instance.zfs))) return;
        await mountZfs(Constants.instance.zfs, Constants.instance.targetZfsDir);

        const list = await getDirs(SOURCE_DIR);
        for (let i = 0; i < list.length; i++) {
            await createDirs(`${Constants.instance.targetZfsDir}/${list[i]}`);
        }

    });

command(`endevor`)
    .description(`endevor operations`)
    .command(`sync`)
    .description(`sync endevor`)
    .action(async () => {
        await endevorSync();
    });

command(`copy <to> <from>`)
    .description(`copy load module to target data set`)
    .action(async (to: string, from: string) => {
        await copyModule(to, from);
    });

command(`create`)
    .description(`create target data sets`)
    .action(async () => {
        await createDataSets();
    });

// TODO(Kelosky): run from TSO
command(`run <target>`)
    .description(`run a program, e.g.\n  zdev run main\n  zdev run mtlmain --steplib ibmuser.loadlib1 ibmuser.loadlib2 --parms\n` +
        `  zdev run lib/run --parms --program ASMTEST1 \\--dds snap 'ibmuser.snap' sysprint 'ibmuser.output' \\--parameters hello --steplib ibmuser.loadlib --parms `)
    .option(`-s, --steplib [dsns...]`, `list of DSNs to STEPLIB`)
    .option(`-tp, --target-parameters [vals...]`, `list of parms to pass`)
    .action(async (target: string, options: any,) => {
        await run(target, options.steplib, options.targetParameters);
    });

command(`make [target]`)
    .description(`run make`)
    .option(`--no-listing`, `prevent downloading listing`)
    .action(async (target: string, options: any) => {
        const getListing = options.listing ? true : false;
        await make(target || "", getListing);
    });

command(`parse-adata <file>`)
    .action(async (file: string) => {
        await parseAdata(file);
    });

command(`parse-coverage <file>`)
    .action(async (file: string) => {
        await parseCoverage(file);
    })

command(`get-output`)
    .description(`get latest job output`)
    .action(async () => {
        await getLatestJobOutput();
    });

command(`mount`)
    .description(`mount zfs`)
    .action(async () => {
        await mountZfs(Constants.instance.zfs, Constants.instance.targetZfsDir);
    });

command(`purge`)
    .description(`purge jobs`)
    .action(async () => {
        await purgeJobs();
    });

command(`unmount`)
    .description(`unmount zfs`)
    .action(async () => {
        await unmount(Constants.instance.zfs);
    });

command(`upload [files...]`)
    .description(`upload zfs files\n  zdev upload\n  zdev upload main.s lib/ecbwait.h\n '.mac' files are upper cased when uploaded without an extension`)
    .option(`-f, --force`)
    .action(async (files: string[], options: any, cmd: Command) => {
        if (options.force) {
            await uploadAll();
        } else if (files.length > 0) {
            await uploadFiles(files);
        } else {
            await uploadChanged();
        }
    });

program.on("option:debug", () => {
    STATE.debug = true;
});

parse(process.argv);
