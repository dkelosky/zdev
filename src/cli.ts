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
import { getDirs } from "./utils";

// TODO(Kelosky): build command that can once per day allocate data sets and cache that info
// TODO(Kelosky): make should trigger allocate conditionally and upload if out of sync
// TODO(Kelosky): create tests on directory so things can be moved without breaking!!
// TODO(Kelosky): sync command to delete old files not needed
// TODO(Kelosky): add lib & init lib command so helper code can be shared with projects
// TODO(Kelosky): run with:
//                  `export _BPXK_JOBLOG=STDERR`

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



