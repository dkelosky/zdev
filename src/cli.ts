#! /bin/env node

// import * as cmd from "commander";
// const cli = new cmd.Command();
import { createDirs, creatZfs } from "./actions/allocate-zfs";
import { init } from "./init";
import { mountZfs } from "./actions/mount";
import { unmount } from "./actions/unmount";
import { uploadAll, uploadChanged, uploadFiles } from "./actions/zfs-upload"
import { version, command, parse, help, Command, description, option } from "commander";
import { TARGET_ZFS_DIR, ZFS, CMD_NAME, TARGET_ZFS_DIR_DEPLOY } from "./constants"
import { make } from "./actions/make";

// TODO(Kelosky): create tests on directory so things can be moved without breaking!!
// TODO(Kelosky): sync command to delete old files not needed

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

command(`allocate-zfs`)
    .description(`allocate zfs`)
    .action(async () => {
        await createDirs(TARGET_ZFS_DIR_DEPLOY);
        await creatZfs(ZFS);
        await mountZfs(ZFS, TARGET_ZFS_DIR);
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

command(`zfs-upload [files...]`)
    .description(`upload zfs files`)
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



