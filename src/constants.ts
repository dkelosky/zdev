import { sep } from "path";

export interface DataSet {
    directoryBlocks?: number;
    recordFormat?: string;
    recordLength?: number;
    dataSetType?: string;
    blockSize?: number;
    size?: string;
    volumeSerial?: string;
}

// TODO(Kelosky): interface for config

export interface DataSets {
    [key: string]: DataSet;
}

// TODO(Kelosky): wrap this in a class and perhaps nested class so that we dont the error on `zdev init` command
export class Constants {

    private static _instance: Constants;
    private static readonly _QUAL = `PUBLIC`; // TODO(Kelosky): configurable
    private static readonly _CONFIG_FILE = `zdev.config.json`;
    private static readonly _CONFIG_USER_FILE = `zdev.config.user.json`;
    private static readonly _LOADLIB = "LOADLIB";
    private static readonly _HOME = "/tmp"; // TODO(Kelosky): configurable

    private _quiet: boolean;

    constructor() {
        this._quiet = false;
    }

    get user() {
        try {
            let userConfig = require(`${process.cwd()}${sep}${Constants._CONFIG_USER_FILE}`);
            return userConfig.user;
        } catch (err) {
            if (!this._quiet) {
                console.log(`📝 no ${Constants._CONFIG_USER_FILE} exists (see '${CMD_NAME} config --help' for more information)\n`);
                throw new Error("see previous message");
            }
        }
    }

    get project() {
        try {
            let projectConfig = require(`${process.cwd()}${sep}${CONFIG_FILE}`);
            return projectConfig.project;
        } catch (err) {
            if (!this._quiet) {
                console.log(`📝 no ${Constants._CONFIG_FILE} exists (see '${CMD_NAME} init --help' for more information)\n`);
                throw new Error("see previous message");
            }
        }
    }

    get hlq() {
        return this.user.toUpperCase();
    }

    get qual() {
        return Constants._QUAL;
    }

    get dsnPattern() {
        return `${this.hlq}.${this.qual}.${this.project.toUpperCase()}.`
    }

    get loadLib() {
        return this.dsnPattern + Constants._LOADLIB;
    }

    set quiet(state: boolean) {
        this._quiet = state;
    }

    get zfs() {
        return `${this.user.toUpperCase()}.${this.qual}.${this.project.toUpperCase()}.ZFS`;
    }

    get home() {
        return Constants._HOME;
    }

    get targetZfsDir() {
        return `${this.home}/${this.user.toLowerCase()}/${this.project.toLowerCase()}`;
    }

    get taretZfsDirDeploy() {
        return `${this.home}/${this.user.toLowerCase()}/${this.project.toLowerCase()}/${SOURCE_DIR}`;
    }

    get listingDir() {
        return `${LISTING_DIR}/${this.project}`;
    }

    get dataSets() {
        try {
            let projectConfig = require(`${process.cwd()}${sep}${CONFIG_FILE}`);
            return projectConfig.dataSets;
        } catch (err) {
            if (!this._quiet) {
                console.log(`📝 no ${Constants._CONFIG_FILE} exists (see '${CMD_NAME} init --help' for more information)\n`);
                throw new Error("see previous message");
            }
            return {};
        }
    }

    refresh() {
        delete require.cache[require.resolve(`${process.cwd()}${sep}${Constants._CONFIG_USER_FILE}`)];
        delete require.cache[require.resolve(`${process.cwd()}${sep}${CONFIG_FILE}`)];
    }

    static get instance() {

        if (this._instance == null) {
            this._instance = new Constants();
        }

        return this._instance;
    }

}

export const LISTING_DIR = ".listings";

export const SOURCE_DIR = `zossrc`;

export const CMD_NAME = `zdev`;
export const CACHE_NAME = `.${CMD_NAME}`;
export const WORK_COVERAGE_DIR = `${CACHE_NAME}${sep}coverage`;
export const COVERAGE_DIR = `coverage`;
export const COVERAGE_FILE = `coverage-final.json`;
export const SOURCE_CACHE_DIR_NAME = `${CACHE_NAME}${sep}${SOURCE_DIR}`;
export const COVERAGE_RESULTS_SUFFIX = `.results.txt`;
export const ADATA_SUFFIX = ".adata";
export const CACHE_SUFFIX = ".json";
export const COVERAGE_ADATA_SUFFIX = `.adata.json`;

export const HLASM_MACRO_SUFFIX = ".mac";

export const JSON_INDENT = 4;

export const BIN_SUFFIX = ".bin";
export const TXT_SUFFIX = ".txt";

export const LISTING_SUFFIX = ".lst";
export const VSCODE_FOLDER = ".vscode";
export const VSCODE_TASKS_FILE = "tasks.json";


export const CONFIG_FILE = `zdev.config.json`;
export const CONFIG_USER_FILE = `zdev.config.user.json`;

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