let config;

try {
    config = require(`${process.cwd()}/user.config.json`);
} catch (err) {
    // do nothing
    // throw new Error("run `zowe-zos-dev init`")
}

// default project
const HELLO_WORLD = "hello";
const USER = "ibmuser";

// user config
const user: string = config?.user || USER;
const project: string = config?.project || HELLO_WORLD;

// PDS and directory pattern
export const ZFS = `${user.toUpperCase()}.PUBLIC.${project.toUpperCase()}.ZFS`;
export const TARGET_DIR = `/tmp/${user.toLowerCase()}/${project.toLowerCase()}`;

// primary command
export const ZOWE = "zowex"; // `zowe` for non-daemon

export const SOURCE_DIR = `zossrc`;