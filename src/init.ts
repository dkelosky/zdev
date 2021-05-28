import { writeFile, exists, mkdir, stat, readdir, readFile, unlink } from "fs";
import { resolve, relative, normalize, sep } from "path";
import { promisify } from "util"
import { uploadAll } from "./actions/zfs-upload";
import { CACHE_NAME, CMD_NAME, SOURCE_DIR } from "./constants";
import { getDirFiles, getDirs } from "./utils";

const write = promisify(writeFile);
const exist = promisify(exists);
const stats = promisify(stat);
const mkdr = promisify(mkdir)
const readDir = promisify(readdir);
const read = promisify(readFile);
const del = promisify(unlink);

const FILE_NAME = "zdev.config.json";

export interface IOptions {
    force: boolean;
}

interface IConfig {
    user: string;
    project: string;
};

export async function updateSource(dir = normalize(__dirname + `/../`), folder = SOURCE_DIR) {

    let exists: boolean = false;
    exists = await exist(`${folder}`);

    if (!exists) {
        await mkdr(`${folder}`);
        console.log(`... making '${folder}'`);
    } else {
        console.log(`... '${folder}' exists`)
    }

    let files = await readDir(`${dir}${sep}${folder}`);

    for (let i = 0; i < files.length; i++) {
        if ((await stats(`${dir}${sep}${folder}${sep}${files[i]}`)).isDirectory()) {
            // console.log(`got ${dir}${sep}${folder}${sep} -- ${files[i]}`)
            await updateSource(`${dir}`, `${folder}${sep}${files[i]}`);
            // console.log(`mkdir ${folder}${sep}${files[i]}`)
            exists = await exist(`${folder}${sep}${files[i]}`);

        } else {
            console.log(`... copying file from '${dir}${sep}${folder}${sep}${files[i]}' to '${folder}${sep}${files[i]}'`)
            let file = (await read(`${dir}${sep}${folder}${sep}${files[i]}`)).toString();

            await write(`${folder}${sep}${files[i]}`, file);
        }
    }

}

export async function init(project: string, user: string, options?: IOptions) {

    let dirExists = await exist(project);
    if (dirExists) {
        console.log(`❌  Directory already initialized.\n`);
        console.log(`Rerun with new project name:\n  ${CMD_NAME} init <project> --user <name> --force`);
    } else {
        process.chdir(project);
        doInit(project, user);
    }
}

async function doInit(project: string, user: string) {
    console.log(`Initializing '${project}' with new config for '${user}'`);
    await initConfig(project, user);
    await initGitIgnore();
    console.log(`✔️  complete.`)
}

async function makeDir(project: string) {
    console.log(`Creating dir ${project}`);
    await mkdr(project);
}

async function initConfig(project: string, user: string) {

    const config: IConfig = { user, project };

    await write(FILE_NAME, JSON.stringify(config, null, 4));
}

async function initGitIgnore() {

    // TODO(Kelosky): push in these lines if .gitignore exists
    // TODO(Kelosky): put these in a config file
    const CONTENT =
        "node_modules\n" +
        "zdev.config.json\n" +
        `${CACHE_NAME}\n` +
        ".listings";

    const GITIGNORE = ".gitignore";

    await write(GITIGNORE, CONTENT);

}