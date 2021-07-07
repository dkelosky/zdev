import { writeFile, exists, mkdir, stat, readdir, readFile, unlink } from "fs";
import { resolve, relative, normalize, sep } from "path";
import { promisify } from "util"
import { uploadAll } from "./actions/zfs-upload";
import { CACHE_NAME, CMD_NAME, CONFIG_FILE, CONFIG_USER_FILE, Constants, WORK_COVERAGE_DIR, DataSets, JSON_INDENT, LISTING_DIR, SOURCE_DIR, VSCODE_FOLDER, VSCODE_TASKS_FILE } from "./constants";
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

export async function reinit() {
    // console.log(Constants.instance.project + " " + Constants.instance.user)
    doInit(Constants.instance.project, Constants.instance.user);
}

export async function initUserConfig(user: string, options?: IOptions) {

    let dirExists = await exist(CONFIG_FILE);
    if (!dirExists) {
        console.log(`❌  ${CONFIG_FILE} not found.\n`);
        console.log(`Run:\n  ${CMD_NAME} init <project> --user <name>`);
    } else {
        const userconfig: IUserConfig = { user };
        console.log(`Writing: ${CONFIG_USER_FILE} ...`); //, JSON.stringify(userconfig, null, JSON_INDENT));
        await write(CONFIG_USER_FILE, JSON.stringify(userconfig, null, JSON_INDENT));
    }
}

async function doInit(project: string, user: string) {
    console.log(`Initializing '${project}' with new config for '${user}'`);
    await initProjectConfig(project, user);
    await initUserConfig(user);

    Constants.instance.refresh(); // rebuild config objects

    await initGitIgnore();
    await initNyc();
    await initReadMe(project);
    await updateSource();
    await setTasks(project, user);
    console.log(`✔️  complete.`)
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
            dataSetType: "LIBRARY"
        },
        ASMPGM: {
            dataSetType: "LIBRARY",
            directoryBlocks: 10,
            recordLength: 80,
            blockSize: 32720,
            recordFormat: "FB",
            size: "5CYL"
        },
        CHDR: {
            dataSetType: "LIBRARY",
            directoryBlocks: 10,
            recordLength: 255,
            blockSize: 32760,
            recordFormat: "VB",
            size: "5CYL"
        },
        SYSOUT: {
            recordFormat: "FB",
            blockSize: 132,
            dataSetType: "LIBRARY",
            recordLength: 132,
            size: "5CYL",
            directoryBlocks: 10
        }
    }

    const config: IConfig = { project, dataSets };
    // const config: IConfig = { user, project };

    await write(CONFIG_FILE, JSON.stringify(config, null, JSON_INDENT));
}

async function initGitIgnore() {

    // TODO(Kelosky): push in these lines if .gitignore exists
    // TODO(Kelosky): put these in a config file

    const CONTENT =
        "node_modules\n" +
        // TODO(Kelosky): user version in gitignore
        `${CONFIG_USER_FILE}\n` +
        `${CACHE_NAME}\n` +
        `${LISTING_DIR}\n` +
        `${WORK_COVERAGE_DIR}\n` +
        "\n";

    const GITIGNORE = ".gitignore";

    await write(GITIGNORE, CONTENT);

}

async function initNyc() {
    const content = {
        extension: [
            ".s"
        ],
        reporter: ["html", "lcov"],
        "report-dir": "./coverage",
        "temp-dir": "./coverage"
    };

    const NYC = `.nycrc.json`;
    await write(NYC, JSON.stringify(content, null, JSON_INDENT));
}

async function initReadMe(project: string) {
    const CONTENT =
        `# ${project}\n` +
        // TODO(Kelosky): user version in gitignore
        "\n" +
        `## Prereq\n` +
        "\n" +
        "- `npm install -g @zowe/cli@next`\n" +
        "- zowe cli daemon (`start zowe --daemon`)\n" +
        "\n" +
        `## First User Setup\n` +
        "\n" +
        "Steps to complete while repo does not yet exist\n" +
        "\n" +
        "- `zowex config init`\n" +
        "- edit config for z/OSMF & SSH\n" +
        "- `git init`\n" +
        "- `git add .`\n" +
        "- `git commit -s -m \"initial\"`\n" +
        "- `git push` to repo\n" +
        "\n" +
        `## Remaining User Setup\n` +
        "\n" +
        "Steps to complete after cloning a project\n" +
        "\n" +
        "- `zowex config secure`\n" +
        "- `zdev config -u <user>`\n" +
        "\n" +
        `## Create\n` +
        "\n" +
        "1. Create <project>.c source file tailored from `mtlmain.c`, `asmtest1.s`, or `asmtes64.s`.\n" +
        "2. Update `makefile` to build new project source.\n" +
        "\n" +
        `## Build\n` +
        "\n" +
        "Run in sequence:\n" +
        "\n" +
        "- `zdev allocate`\n" +
        "- `zdev update [--force]`\n" +
        "- `zdev make [target]`\n" +
        "- `zdev run <target>`\n" +
        "\n" +
        "## Run\n" +
        "\n" +
        "For simple programs, run `zdev run main`.\n" +
        "\n" +
        "For dynamic allocation, use `./lib/run` wrapper.  See `.vcode/tasks.json` task `▶️ run`\n" +
        "\n" +
        "## CHDSECT\n" +
        "\n" +
        "If you need to create CHDRs from DSECTs" +
        "\n" +
        "1. create like csvexti.s:\n" +
        "\n" +
        "```txt\n" +
    "         CSVEXTI DSECT=YES\n" +
    "         END ,\n" +
    "```\n" +
    "\n" +
        "2. `zdev upload`\n" +
        "3. run `✨ asm2hdr` task\n" +
        "\n" +
    " ## Recommended\n" +
    "\n" +
    "Install [`Tasks`](https://marketplace.visualstudio.com/items?itemName=actboy168.tasks)"
    ;

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
        version: "2.0.0",
        inputs: [
            {
                id: "copyName",
                type: "promptString",
                description: "adata file to copy"
            }
        ],
        tasks: [
            {
                "label": "source copy",
                "options": {
                    "statusbar": {
                        "hide": true
                    }
                },
                "type": "process",
                "command": "zowex",
                "args": [
                    "uss",
                    "issue",
                    "ssh",
                    `\"cd /tmp/${user}/${project}/zossrc && cp \${input:promptName}.s \"//'${user.toUpperCase()}.PUBLIC.${project.toUpperCase()}.ASMPGM(\${input:promptName})'\" \"`
                ],
                "problemMatcher": []
            },
            {
                "label": "dsect adata",
                "options": {
                    "statusbar": {
                        "hide": true
                    }
                },
                "command": "zdev",
                "type": "shell",
                "args": [
                    "make",
                    "${input:promptName}.o"
                ],
                "problemMatcher": []
            },
            {
                "label": "chdsect",
                "options": {
                    "statusbar": {
                        "hide": true
                    }
                },
                "command": "zdev",
                "type": "shell",
                "args": [
                    "run",
                    "lib/run",
                    "--target-parameters",
                    "\\--program",
                    "CCNEDSCT",
                    "\\--dds",
                    "sysprint",
                    `'${user}.public.${project}.sysprint(output)'`,
                    "sysout",
                    `'${user}.public.${project}.sysout(sysout)'`,
                    "sysadata",
                    `'${user}.public.${project}.asmpgm.adata(\${input:promptName})'`,
                    "edcdsect",
                    `'${user}.public.${project}.chdr(\${input:promptName})'`,
                    "\\--parameters",
                    "'PPCOND,EQUATE(DEF),BITF0XL,HDRSKIP,UNIQ,LP64,LEGACY,SECT(ALL)'",
                    "--steplib",
                    "CEE.SCEERUN2",
                    "CBC.SCCNCMP",
                    "CEE.SCEERUN"
                ],
                "problemMatcher": []
            },
            {
                "label": "chdr download",
                "options": {
                    "statusbar": {
                        "hide": true
                    }
                },
                "command": "zowex",
                "type": "shell",
                "args": [
                    "files",
                    "download",
                    "ds",
                    `'${user}.public.${project}.chdr(\${input:promptName})'`,
                    "--file",
                    "zossrc/${input:promptName}.h"
                ],
                "problemMatcher": []
            },
            {
                "label": "✨ asm2hdr",
                "dependsOrder": "sequence",
                "dependsOn": [
                    "source copy", "dsect adata", "chdsect", "chdr download"
                ],
            },
            {
                "label": "⬆️ upload",
                "options": {
                    "statusbar": {
                        // "hide": true
                    },
                },
                "type": "shell",
                "command": "zdev",
                "args": [
                    "upload",
                ]
            },
            {
                "label": "👷 build",
                "options": {
                    "statusbar": {
                        // "hide": true
                    },
                },
                "type": "shell",
                "command": "zdev",
                "args": [
                    "make",
                    // `${project}`,
                    // `--no-listings`
                ],
                "dependsOn": [
                    "⬆️ upload"
                ]
            },
            {
                "label": "✂️ copy",
                "options": {
                    "statusbar": {
                        // "hide": true
                    },
                },
                "type": "shell",
                "command": "zdev",
                "args": [
                    "copy",
                    `${project}`,
                    `${Constants.instance.loadLib}`,
                ],
                "dependsOn": [
                    "👷 build"
                ]
            },
            {
                "label": "▶️ run",
                "options": {
                    "statusbar": {
                        // "hide": true
                    },
                },
                "type": "shell",
                "command": "zdev",
                "args": [
                    "run",
                    "lib/run",
                    "--target-parameters",
                    "\\--program",
                    `${project.toUpperCase()}`,
                    "\\--dds",
                    "sysprint",
                    `'${user}.public.${project}.sysprint(output)'`,
                    // "\"--program ZCOV\"",
                    // "\\\"--program ZCOV \\\"",
                    "--steplib",
                    `${Constants.instance.loadLib}`,
                ],
                "dependsOn": [
                    "✂️ copy"
                ]
            },
            // {
            //     "label": "copy",
            //     "type": "shell",
            //     "command": "zowex",
            //     // "options": {
            //     //     "shell": {
            //     //         "executable": "cmd.exe"
            //     //     }
            //     // },
            //     // need final string to have \" for zowex command
            //     "args": ["uss", "issue", "ssh", `\\\"cd ${Constants.instance.taretZfsDirDeploy} && cp -X zcov \\\"//'${Constants.instance.loadLib}'\\\" \\\"`]
            // },
        ]
    }

    await write(`${VSCODE_FOLDER}${sep}${VSCODE_TASKS_FILE}`, JSON.stringify(task, null, JSON_INDENT))
}