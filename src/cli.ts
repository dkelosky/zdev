#! /bin/env node

// import * as cmd from "commander";
// const cli = new cmd.Command();
import { createDirs, creatZfs } from "./actions/allocate-zfs";
import { init } from "./init";
import { mountZfs } from "./actions/mount";
import { unmount } from "./actions/unmount";
import { uploadAll, uploadChanged, uploadFiles } from "./actions/zfs-upload"
import { version, command, parse, help, Command, description, option } from "commander";
import { TARGET_ZFS_DIR, ZFS, CMD_NAME, TARGET_ZFS_DIR_DEPLOY, SOURCE_DIR } from "./constants"
import { make } from "./actions/make";
import { getDirs, getListings, runCmd } from "./utils";
import { run } from "./actions/run";

// BPXBATCH - ZOA
// https://www.ibm.com/docs/en/zos/2.3.0?topic=functions-dynalloc-allocate-data-set
// https://www.ibm.com/docs/en/zos/2.2.0?topic=output-example-calling-bpxwdyn-from-c
// https://www.ibm.com/docs/en/zos/2.1.0?topic=descriptions-extattr-set-reset-display-extended-attributes-files
// https://www.ibm.com/docs/en/zos/2.1.0?topic=descriptions-exec-bpx1exc-bpx4exc-run-program

// TODO(Kelosky): template files
// TODO(Kelosky): help with asmchdrs
// TODO(Kelosky): build command that can once per day allocate data sets and cache that info
// TODO(Kelosky): make should trigger allocate conditionally and upload if out of sync
// TODO(Kelosky): create tests on directory so things can be moved without breaking!!
// TODO(Kelosky): sync command to delete old files not needed
// TODO(Kelosky): add lib & init lib command so helper code can be shared with projects
// TODO(Kelosky): fallback for batch / JCL to build

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

version(`0.0.1`)
description(`Example:\n` +
    `  ${CMD_NAME} init <name> -u kelda16\n` +
    `  ${CMD_NAME} allocate\n`
);

command(`init <project>`)
    .requiredOption(`-u, --user <name>`)
    .option(`-f, --force`)
    .description(`init a project`)
    .action(async (project: string, options: any, cmd: Command) => {
        await init(project, options.user, { force: options.force });
    });

// TODO(Kelosky): for these test for user = IBMUSER
// TODO(Kelosky): test for z/osmf profile
// TODO(Kelosky): on fresh create zfs, clear cache if it exists

command(`allocate`)
    .description(`allocate zfs`)
    .action(async () => {
        await createDirs(TARGET_ZFS_DIR);
        await creatZfs(ZFS);
        await mountZfs(ZFS, TARGET_ZFS_DIR);

        const list = await getDirs(SOURCE_DIR);

        for (let i = 0; i < list.length; i++) {
            await createDirs(`${TARGET_ZFS_DIR}/${list[i]}`);
        }

    });

command(`x`)
    .description(`zdev testing`)
    .action(async () => {

        const listing =
        `xlc++ -W "c,lp64,langlvl(extended),xplink,exportall" -qsource  -g  -c -qlist=lib/run.cpp.lst -o lib/run.o lib/run.cpp\n` +
        `"lib/runexec.h", line 1.0: CCN5809 (W) The source file is empty.\n` +
        `"lib/run.cpp", line 6.5: CCN8145 (W) "main" cannot be exported. The directive is ignored.\n` +
        `xlc -S -W "c,metal, langlvl(extended), sscom, nolongname, inline, genasm, inlrpt, csect, nose, list, optimize(2), list, showinc, showmacro, source, aggregate" -qlist=lib/runexec.mtl.lst -I/usr/include/metal  -Ilib/ -o lib/runexec.s lib/runexec.c\n` +
        `WARNING CCN3229 lib/runexec.h:1     File is empty.\n` +
        `as  -a=lib/runexec.asm.lst -ISYS1.MACLIB  -ICBC.SCCNSAM -o lib/runexec.o lib/runexec.s\n` +
        ` Assembler Done No Statements Flagged\n` +
        `xlc++ -W "l,lp64,dll,dynam=dll,xplink,map,list"  -g  -qsource -o lib/run lib/run.o lib/runexec.o > lib/run.bind.lst\n` +
        `IGD01008I ALLOCATION SET TO SCTEMPD M0610\n` +
        `IGD01010I ALLOCATION SET TO SGTEMPD STORAGE GROUP\n` +
        `IGD01008I ALLOCATION SET TO SCTEMPD M0610\n` +
        `IGD01010I ALLOCATION SET TO SGTEMPD STORAGE GROUP\n`;

        const list = await getListings(listing);
        console.log(list);
    });

command(`run <target>`)
    .description(`run a file`)
    .action(async (target: string) => {
        await run(target);
    });

command(`make [target]`)
    .description(`run make`)
    .action(async (target: string) => {
        await make(target || "");
    });

command(`mount`)
    .description(`mount zfs`)
    .action(async () => {
        await mountZfs(ZFS, TARGET_ZFS_DIR);
    });

command(`unmount`)
    .description(`unmount zfs`)
    .action(async () => {
        await unmount(ZFS);
    });

command(`upload [files...]`)
    .description(`upload zfs files\n  zdev upload\n  zdev upload main.s lib/ecbwait.h`)
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

const cmd = parse(process.argv);

if (cmd.args.length === 0) {
    help();
}



