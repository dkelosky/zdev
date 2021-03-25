import { writeFile, exists } from "fs";
import { promisify } from "util"

const write = promisify(writeFile);
const exist = promisify(exists);

const FILE_NAME = "user.config.json";

export interface IOptions {
    force: boolean;
}

interface IConfig {
    user: string;
    project: string;
};

export async function init(project: string, user: string, options?: IOptions) {

    const exists = await exist(FILE_NAME);

    if (exists) {

        if (options?.force) {
            doInit(project, user);
        } else {
            console.log(`❌  Project already initialized.\n`);
            console.log(`Rerun:\n  zowe-zos-dev init <project> --user <name> --force`);
        }

    } else {
        doInit(project, user);
    }

}

async function doInit(project: string, user: string) {
    console.log(`Initializing '${project}' with new config for '${user}'`);
    await initConfig(project, user);
    await initGitIgnore();
    console.log(`✔️  complete.`)
}

async function initConfig(project: string, user: string) {

    const config: IConfig = { user, project };

    await write(FILE_NAME, JSON.stringify(config, null, 4));
}

async function initGitIgnore() {

    const CONTENT =
        "node_modules\n" +
        "user.config.json\n";

    const GITIGNORE = ".gitignore";

    await write(GITIGNORE, CONTENT);

}