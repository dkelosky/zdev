import { sep } from "path";

export const SOURCE_DIR = `zossrc`;

export const CMD_NAME = `zowe-zos-dev`;
export const CACHE_NAME = `.${CMD_NAME}`;
export const SOURCE_CACHE_DIR_NAME = `${CACHE_NAME}${sep}${SOURCE_DIR}`;

export const CACHE_SUFFIX = ".json";

export const LISTING_DIR = ".listings";

export const LISTING_SUFFIX = ".lst";
export const VSCODE_FOLDER = ".vscode";
export const VSCODE_TASKS_FILE = "tasks.json";

let config;

try {
    // NOTE(Kelosky): must be process
    config = require(`${process.cwd()}${sep}zdev.config.json`);
} catch (err) {
    console.log(`📝 no config exists, see ${CMD_NAME} init --help\n`);
}

// default project
const HELLO_WORLD = "hello";
const USER = "ibmuser";
const HOME = `/tmp`

// user config
const user: string = config?.user || USER;
const project: string = config?.project || HELLO_WORLD;
const home: string = config?.home || HOME;

// PDS and directory pattern
export const ZFS = `${user.toUpperCase()}.PUBLIC.${project.toUpperCase()}.ZFS`;
export const TARGET_ZFS_DIR = `${home}/${user.toLowerCase()}/${project.toLowerCase()}`;
export const TARGET_ZFS_DIR_DEPLOY = `${home}/${user.toLowerCase()}/${project.toLowerCase()}/${SOURCE_DIR}`;

// primary command
export const ZOWE = "zowex"; // `zowe` for non-daemon

class State {

    constructor(private _debug = false) { }

    get debug() {
        return this._debug;
    }

    set debug(newState: boolean) {
        this._debug = newState;
    }
}

export const STATE = new State();