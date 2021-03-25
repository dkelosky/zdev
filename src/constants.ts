import { sep } from "path";

export const SOURCE_DIR = `zossrc`;

export const CMD_NAME = `zowe-zos-dev`;
export const CACHE_NAME = `.${CMD_NAME}`;
export const SOURCE_CACHE_DIR_NAME = `${CACHE_NAME}${sep}${SOURCE_DIR}`;

export const CACHE_SUFFIX = ".json";

let config;

try {
    // NOTE(Kelosky): must be process
    config = require(`${process.cwd()}${sep}user.config.json`);
} catch (err) {
    console.log(`📝 no config exists, see ${CMD_NAME} init --help\n`);
}

// default project
const HELLO_WORLD = "hello";
const USER = "ibmuser";

// user config
const user: string = config?.user || USER;
const project: string = config?.project || HELLO_WORLD;

// PDS and directory pattern
export const ZFS = `${user.toUpperCase()}.PUBLIC.${project.toUpperCase()}.ZFS`;
export const TARGET_ZFS_DIR = `/tmp/${user.toLowerCase()}/${project.toLowerCase()}`;

// primary command
export const ZOWE = "zowex"; // `zowe` for non-daemon
