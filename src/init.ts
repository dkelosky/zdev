import { writeFile, exists, mkdir, stat, readdir, readFile, unlink } from "fs";
import { resolve, relative, normalize, sep } from "path";
import { promisify } from "util"
import { uploadAll } from "./actions/zfs-upload";
import { CACHE_NAME, CMD_NAME, CONFIG_FILE, CONFIG_USER_FILE, Constants, DataSets, SOURCE_DIR, VSCODE_FOLDER, VSCODE_TASKS_FILE } from "./constants";
import { getDirFiles, getDirs } from "./utils";

const write = promisify(writeFile);
const exist = promisify(exists);
const stats = promisify(stat);
const mkdr = promisify(mkdir)
const readDir = promisify(readdir);
const read = promisify(readFile);
const del = promisify(unlink);

export interface IOptions {
    force: boolean;
}

interface IConfig {
    project: string;
    dataSets?: DataSets
};

interface IUserConfig {
    user: string;

};



export async function updateSource(dir = normalize(__dirname + `/../`), folder = SOURCE_DIR) {

    let created: boolean = false;
    created = await exist(`${folder}`);

    if (!created) {
        await mkdr(`${folder}`);
        console.log(`... making '${folder}'`);
    } else {
        console.log(`... '${folder}' exists`)
    }

    let files = await readDir(`${dir}${sep}${folder}`);

    for (let i = 0; i < files.length; i++) {
        if ((await stats(`${dir}${sep}${folder}${sep}${files[i]}`)).isDirectory()) {
            await updateSource(`${dir}`, `${folder}${sep}${files[i]}`);
            created = await exist(`${folder}${sep}${files[i]}`);

        } else {
            console.log(`... copying file from '${dir}${sep}${folder}${sep}${files[i]}' to '${folder}${sep}${files[i]}'`)
            let file = (await read(`${dir}${sep}${folder}${sep}${files[i]}`)).toString();

            await write(`${folder}${sep}${files[i]}`, file);
        }
    }

}

export async function init(project: string, user: string, options?: IOptions) {

    // Constants.instance.quiet = true;
    // console.log(Constants.instance.user)
    // Constants.instance.quiet = false;

    let dirExists = await exist(project);
    if (dirExists) {
        console.log(`❌  Directory already initialized.\n`);
        console.log(`Rerun with new project name:\n  ${CMD_NAME} init <project> --user <name> --force`);
    } else {
        await mkdr(project);
        process.chdir(process.cwd() + sep + project);
        await doInit(project, user);
    }
}

export async function initUserConfig(user: string, options?: IOptions) {

    let dirExists = await exist(CONFIG_FILE);
    if (!dirExists) {
        console.log(`❌  ${CONFIG_FILE} not found.\n`);
        console.log(`Run:\n  ${CMD_NAME} init <project> --user <name>`);
    } else {
        const userconfig: IUserConfig = { user };
        await write(CONFIG_USER_FILE, JSON.stringify(userconfig, null, 4));
    }
}

async function doInit(project: string, user: string) {
    console.log(`Initializing '${project}' with new config for '${user}'`);
    await initProjectConfig(project, user);
    await initGitIgnore();
    await initUserConfig(user);

    Constants.instance.refresh(); // rebuild config objects

    await updateSource();
    await setTasks(project, user);
    console.log(`✔️  complete.`)
}

async function makeDir(project: string) {
    console.log(`Creating dir ${project}`);
    await mkdr(project);
}

async function initProjectConfig(project: string, user: string) {


    const dataSets: DataSets =
    {
        LOADLIB: {
            blockSize: 32760,
            directoryBlocks: 20,
            recordFormat: "U",
            recordLength: 15476,
            dataSetType: "LIBRARY",
            size: "5CYL"
        },
        CLIST: {
            "dataSetType": "LIBRARY"
        }
    }

    const config: IConfig = { project, dataSets };
    // const config: IConfig = { user, project };

    await write(CONFIG_FILE, JSON.stringify(config, null, 4));
}

async function initGitIgnore() {

    // TODO(Kelosky): push in these lines if .gitignore exists
    // TODO(Kelosky): put these in a config file
    const CONTENT =
        "node_modules\n" +
        // TODO(Kelosky): user version in gitignore
        "zdev.config.user.json\n" +
        `${CACHE_NAME}\n` +
        ".listings\n" +
        "\n";

    const GITIGNORE = ".gitignore";

    await write(GITIGNORE, CONTENT);

}

async function initReadMe(project: string) {
    const CONTENT =
        `# ${project}\n` +
        // TODO(Kelosky): user version in gitignore
        "\n" +
        `## Prereq\n` +
        "\n" +
        "- zowe cli\n" +
        "- zowe cli daemon\n" +
        "\n" +
        `## Setup\n` +
        "\n" +
        "- `zowex config init` (fill in z/OSMF && SSH)\n" +
        "- `git init`\n" +
        "- `git add .`\n" +
        "- `git commit -s -m \"initial\" .`\n" +
        "- `zdev config -u <user>`\n" +
        "\n" +
        `## Build\n` +
        "\n" +
        "Install `Tasks` VS Code Extension by actboy168 or...\n" +
        "\n" +
        "- `zdev allocate\n" +
        "- `zdev update [--force]\n" +
        "- `zdev make <target>\n" +
        "- `zdev run <target>\n" +
        "\n";

    const README = "README.md";
    await write(README, CONTENT);
}

export async function setTasks(project: string, user: string) {
    let created = await exist(VSCODE_FOLDER);

    if (!created) {
        await mkdr(`${VSCODE_FOLDER}`);
        console.log(`... making '${VSCODE_FOLDER}'`);
    } else {
        console.log(`... '${VSCODE_FOLDER}' exists`)
    }


    // TODO(Kelosky): read project json and adjust copy accodingly
    const task = {
        // See https://go.microsoft.com/fwlink/?LinkId=733558
        // for the documentation about the tasks.json format
        "version": "2.0.0",
        "tasks": [
            {
                "label": "⬆️ upload",
                "type": "shell",
                "command": "zdev",
                "args": [
                    "upload",
                ]
            },
            {
                "label": "👷 build",
                "type": "shell",
                "command": "zdev",
                "args": [
                    "make",
                    "zcov"
                ],
                "dependsOn": [
                    "⬆️ upload"
                ]
            },
            {
                "label": "▶️ run",
                "type": "shell",
                "command": "zdev",
                "args": [
                    "run",
                    "zcov"
                ],
                "dependsOn": [
                    "👷 build"
                ]
            },
            {
                "label": "copy",
                "type": "shell",
                "command": "zowex",
                // "options": {
                //     "shell": {
                //         "executable": "cmd.exe"
                //     }
                // },
                // need final string to have \" for zowex command
                "args": ["uss", "issue", "ssh", `\\\"cd ${Constants.instance.taretZfsDirDeploy} && cp -X zcov \\\"//'${Constants.instance.loadLib}'\\\" \\\"`]
            },
        ]
    }

    await write(`${VSCODE_FOLDER}${sep}${VSCODE_TASKS_FILE}`, JSON.stringify(task, null, 4))
}