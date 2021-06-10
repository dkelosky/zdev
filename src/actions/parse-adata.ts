
import { readFile, mkdir, exists, stat, writeFile } from "fs";
import { sep, basename } from "path";
import { promisify,  } from "util";
import { CACHE_SUFFIX, TXT_SUFFIX, COVERAGE_DIR, JSON_INDENT } from "../constants";
import { Adata } from "./doc/Adata";
import { MachineRecord } from "./doc/MachineRecord";

const read = promisify(readFile);
const mdir = promisify(mkdir);
const exist = promisify(exists);
const stats = promisify(stat);
const write = promisify(writeFile);

// https://www.ibm.com/docs/en/zos/2.1.0?topic=output-adata-record-layouts
// https://www.ibm.com/docs/en/zos/2.1.0?topic=output-common-header-section
const ADATA_HEADER_LEN = 12;

/**
 * Header record layout:
 * ====================
 * FL1 16 assembler
 * XL2 x'0000' JOB ID rec
 *     x'0001' ADATA ID rec
 *     x'0002' Compilation Unit Start / End rec
 *             // XL2 indicator
 *             //  x'0000' start
 *             //  x'0001' end
 *             // XL2 reserved
 *             // record count
 *             // FL4 all ADATA record count for end record or zero for start
 *     x'000A' Output file info rec
 *     x'0010' Options rec
 *     x'0020' ESD rec
 *     x'0030' Source analysis rec
 *     x'0036' Machine instruction rec
 *     x'0042' Symbol rec
 *     x'0044' Symbol and literal cross reference
 *     x'0045' Register cross reference
 *     x'0090' Assembly stats rec
 * FL1 ADATA arch level
 * XL1 Flag
 * FL1 Edition
 * XL4 Reserved
 * HL2 Len
 */
export async function parseAdata(file: string) {

    console.log(`⚠️  This command probably does not belong here`);

    try {
        await stats(COVERAGE_DIR);
    } catch (err) {
        await mdir(COVERAGE_DIR);
    }

    const data = await read(file);

    const records = []; // every record
    const adata: Adata = { // records we care about
        machineRecords: []
    };

    let currIndex = 0;
    const LEN_INDEX_START = 10;
    const MACHINE_INSTRUCTION_RECORD = 0x36;

    let len = 0;
    let type = 0;
    let record: Buffer;

    const typeHash = new Map<number, null>();

    while (true) {
        len = data.readInt16BE(currIndex + LEN_INDEX_START);
        type = data.readInt16BE(currIndex + 1);

        typeHash.set(type, null);
        record = data.slice(currIndex, currIndex + ADATA_HEADER_LEN + len);
        records.push(record);
        if (type === MACHINE_INSTRUCTION_RECORD ) {
            adata.machineRecords.push(parseMachineRecord(record));
        }
        currIndex = currIndex + ADATA_HEADER_LEN + len;
        if (currIndex >= data.length) break; // NOTE(Kelosky): should probably break on end record?
    }

    //
    // serialize adata as json
    //
    await write(`${COVERAGE_DIR}${sep}${basename(file)}${CACHE_SUFFIX}`, JSON.stringify(adata, null, JSON_INDENT));
    console.log(`... wrote ${COVERAGE_DIR}${sep}${basename(file)}${CACHE_SUFFIX}`);

    //
    // write data as text file
    //
    let flat = "";

    for (let i = 0; i < adata.machineRecords.length; i++) {
        flat += `${adata.machineRecords[i].statement},${adata.machineRecords[i].location},${adata.machineRecords[i].length},${adata.machineRecords[i].instruction}\n`;
    }

    await write(`${COVERAGE_DIR}${sep}${basename(file)}${TXT_SUFFIX}`, flat);
    console.log(`... wrote ${COVERAGE_DIR}${sep}${basename(file)}${TXT_SUFFIX}`);

}

/**
 * x'0036' Machine instruction rec layout:
 * =======================================
 * FL4 ESDID machine instruction rec
 * FL4 statement number rec
 * FL4 location counter rec
 * XL8 reserve
 * FL4 instruction offset rec
 * FL4 instruction length rec
 * XL(n) value of the machine instruction
 */
function parseMachineRecord(record: Buffer): MachineRecord {

    const ESDID_START = ADATA_HEADER_LEN;
    const LEN_STATEMENT_START = ESDID_START + 4;
    const LOCATION_START = LEN_STATEMENT_START + 4;
    const RESERVE_START = LOCATION_START + 4;
    const INSTRUCTION_OFFSET = RESERVE_START + 8;
    const INSTRUCTION_LENGTH = INSTRUCTION_OFFSET + 4;
    const INSTRUCTION_VALUE = INSTRUCTION_LENGTH + 4;

    const esdid = record.readInt32BE(ESDID_START);
    const statementNumber = record.readInt32BE(LEN_STATEMENT_START);
    const locationCounter = record.readInt32BE(LOCATION_START);
    const instructionOffset = record.readInt32BE(INSTRUCTION_OFFSET); // TODO(Kelosky): how you `should` offset to instruction, e.g. using offset rec
    const instructionLength = record.readInt32BE(INSTRUCTION_LENGTH);

    const machRec: MachineRecord = {
        esdid,
        statement: statementNumber,
        location: locationCounter,
        offset: instructionOffset,
        length: instructionLength,
        instruction: []
    };

    // read in 2 bytes at a time
    const lenToRead = instructionLength / 2;
    for (let i = 0; i < lenToRead; i++) {
        machRec.instruction.push(record.readUInt16BE(INSTRUCTION_VALUE + i));
    }

    return machRec;

}