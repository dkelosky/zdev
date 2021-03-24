#! /bin/env node

// import * as cmd from "commander";
// const cli = new cmd.Command();
import { createDirs, creatZfs } from "./allocate";
import { init } from "./init";
import { mountZfs } from "./mount";
import { version, command, parse, help, Command, description, option } from "commander";
import { ZOWE, TARGET_DIR, ZFS } from "./constants"

version(`0.0.1`)
description(`Example:\n` +
    `  zowe-zos-dev init <name> -u kelda16\n` +
    `  zowe-zos-dev allocate\n`
);

command(`init <project>`)
    .requiredOption(`-u, --user <name>`)
    // .requiredOption(`-u, --user <name>`)
    .option(`-f, --force`)
    .description(`init a project`)
    .action(async (project: string, options: any, cmd: Command) => {
        // console.log(project)
        // console.log(options)
        // console.log(cmd)
        await init(project, options.user, {force: options.force});
    });

// TODO(Kelosky): for these test for user = IBMUSER
// TODO(Kelosky): test for z/osmf profile

command(`allocate`)
    .description(`allocate zfs`)
    .action(async () => {
        await createDirs(TARGET_DIR);
        await creatZfs(ZFS);
        await mountZfs(ZFS, TARGET_DIR);
    });


const cmd = parse(process.argv);

if (cmd.args.length === 0) {
    help();
}



