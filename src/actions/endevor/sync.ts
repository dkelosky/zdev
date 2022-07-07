import { dirname, sep } from "path";
import { CACHE_NAME, CACHE_SUFFIX, Constants, Endevor, JSON_INDENT, ZOWE } from "../../constants";
import { promisify } from "util"
import { readdir, exists, stat, mkdir, writeFile, readFile, Stats, unlink, Dirent } from "fs";
import { getDirs, runCmd } from "../../utils";

interface Cache {
    match: string;
}

const stats = promisify(stat);

// TODO(Kelosky): add try / catch around fs.stat instead of `exists`
const exist = promisify(exists);
const write = promisify(writeFile);
const mdir = promisify(mkdir);
const readDir = promisify(readdir);
const del = promisify(unlink);
const read = promisify(readFile);

// TODO(Kelosky): run more in parallel to speed up download
export async function endevorSync() {

    const endevor: Endevor = Constants.instance.endevor;
    const hlq = endevor.hlq;

    // console.log(`endevorSync ${endevor} `);

    // remove the `.MOTM` if present
    await createCachedDirs(hlq.split(".")[0].toLowerCase());

    // TODO(Kelosky): validate endevor config
    for (let i = 0; i < endevor.systems.length; i++) {
        const system = endevor.systems[i];

        for (let j = 0; j < endevor.subsystems.length; j++) {
            const subsystem = endevor.subsystems[j];

            for (let k = 0; k < endevor.environments.length; k++) {
                const environment = endevor.environments[k];

                for (let l = 0; l < endevor.types.length; l++) {
                    const type = endevor.types[l];

                    Object.keys(type).forEach(async (key) => {
                        // for (let l = 0; l < endevor.types.length; l++) {

                        const dsn = `${hlq}.${system}.${subsystem}.${environment}.${key}`;

                        const listCmd = `${ZOWE} files list am ${dsn}`;
                        const strResp = await runCmd(listCmd);

                        // const extension =
                        // console.log(`data set ${dsn}`)
                        // console.log(type[key])

                        // console.log(`dsnToPath ${dsnToPath(dsn)}`)

                        if (strResp) {
                            // console.log(`✔️  ${strResp}  - ${dsn}`);
                            await download(strResp, dsn, type[key]);
                            return true;
                        } else {
                            console.log(`⚠️  unknown list status\n`);
                            return false;
                        }

                        // const type = endevor.types[l];

                        // const zfsPath = `${Constants.instance.targetZfsDir}/${system}/${environment}/${subsystem}/${type}`;
                        // await createDirs(zfsPath);
                    });
                }

            }
        }
    }
    // do nothing
}

async function download(stresp: string, dsn: string, extension: string) {
    const each = stresp.split("\n");
    each.pop(); // remove last empty line

    let match = undefined;

    for (let i = 0; i < each.length; i++) {
        let downloadCmd = `${ZOWE} files download ds ${dsn}(${each[i]}) --extension ${extension} --etag`;

        const file = (dsnToPath(dsn) + sep + each[i].toLowerCase() + extension).trim();
        const cache = await readCached(file);
        const match = cache.match
        downloadCmd += (match == null) ? "" : " --match " + match;

        const strResp = await runCmd(downloadCmd, true);

        if (strResp) {
            const jsonResp = JSON.parse(strResp);

            if (jsonResp.success === true) {
                console.log(`📝 ... ${jsonResp.stdout}`)

                const etag = jsonResp.data.apiResponse.etag;

                if (!etag) {
                    console.log(`⚠️  no etag found`)
                    // return;
                } else {
                    await updateCached(file, etag);
                }

            }

        } else {
            console.log(`⚠️  unknown download status\n`);
        }

    }
}

async function readCached(file: string): Promise<Cache> {

    const cachedFile = `${CACHE_NAME}${sep}${file}${CACHE_SUFFIX}`;

    try {
        await stats(cachedFile);
        const data = await read(`${cachedFile}`, "utf8");
        return JSON.parse(data);
    } catch (err) {
        return {} as Cache;
    }

}

function dsnToPath(dsn: string) {
    return dsn.split(".").join(sep).toLowerCase();
}

export async function updateCached(file: string, etag: string) {
    await createCachedDirs(dirname(file));

    const st = await stats(file);
    if (st.isFile()) {
        const cache: Cache = { match: etag };
        await write(`${CACHE_NAME}${sep}${file}${CACHE_SUFFIX}`, JSON.stringify(cache, null, JSON_INDENT));
    } else {
        // TODO(Kelosky): logging to get current line
        console.log(`⚠️ '${file}' does not exist.`)
    }
}

async function createCachedDirs(source: string) {
    if (!(await exist(CACHE_NAME))) {
        await mdir(CACHE_NAME);
    }

    const dirs = await getDirs(source);

    for (let i = 0; i < dirs.length; i++) {
        if (!(await exist(`${CACHE_NAME}${sep}${dirs[i]}`)))
            await mdir(`${CACHE_NAME}${sep}${dirs[i]}`)
    }
}