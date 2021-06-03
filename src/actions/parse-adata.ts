
import { readFile } from "fs";
import { promisify } from "util";

const read = promisify(readFile);

// https://www.ibm.com/docs/en/zos/2.1.0?topic=output-adata-record-layouts
const ADATA_HEADER_LEN = 12;

export async function parseAdata(file: string) {

    const data = await read(file);

    const records = [];
    const machineRecords = [];

    //
    // Header
    //
    // FL1 16 assembler
    // XL2 x'0000' JOB ID rec
    //     x'0001' ADATA ID rec
    //     x'0002' Compilation Unit Start / End rec
    //     x'000A' Output file info rec
    //     x'0010' Options rec
    //     x'0020' ESD rec
    //     x'0030' Source analysis rec
    //     x'0036' Machine instruction rec
    //     x'0042' Symbol rec
    //     x'0044' Symbol and literal cross reference
    //     x'0045' Register cross reference
    //     x'0090' Assembly stats rec

    let currIndex = 0;
    const LEN_INDEX_START = 10;
    // const LEN_INDEX_END = 11;

    // XL2 indicator
    //  x'0000' start
    //  x'0001' end
    // XL2 reserved
    // record count
    // FL4 all ADATA record for end record or zero for start
    const RECORD_TYPE_START_OR_END = 2;
    const MACHINE_INSTRUCTION_RECORD = 0x36;
    // console.log(MACHINE_INSTRUCTION_RECORD)

    let len = 0;
    let type = 0;
    let record: Buffer;

    const typeHash = new Map<number, null>();

    console.log(data.length)
    while (true) {
        len = data.readInt16BE(currIndex + LEN_INDEX_START);
        type = data.readInt16BE(currIndex + 1);


        typeHash.set(type, null);
        record = data.slice(currIndex, currIndex + ADATA_HEADER_LEN + len);
        records.push(record);
        if (type === MACHINE_INSTRUCTION_RECORD ) {
            parseMachineRecord(record)
        }
        // console.log(`length after record ${len}`);
        // console.log(record);
        currIndex = currIndex + ADATA_HEADER_LEN + len;
        if (currIndex >= data.length) break;
    }

    // typeHash.forEach((val, key) => {
    //     console.log(`type needed: ${key}`)
    // });

    // currIndex = currIndex + ADATA_HEADER_LEN + len;
    // console.log(`current index ${currIndex}`)

    // len = data.readInt16BE(currIndex + LEN_INDEX_START);
    // record = data.slice(currIndex, currIndex + ADATA_HEADER_LEN + len);
    // console.log(`length after record ${len}`);
    // console.log(record);


    // currIndex = currIndex + ADATA_HEADER_LEN + len;
    // console.log(`current index ${currIndex}`)

    // len = data.readInt16BE(currIndex + LEN_INDEX_START);
    // record = data.slice(currIndex, currIndex + ADATA_HEADER_LEN + len);
    // console.log(`length after record ${len}`);
    // console.log(record);

    // console.log(data.slice(0, 11+1))
    // console.log(data.slice(0, 12))
    // console.log(data.slice(0, 12))
    // console.log(data.slice(0, 1+1))
    // const len = data.slice(10, 11+1).readInt16LE(0)
    // console.log(record)
    // console.log(data.slice(0, 12))
}

function parseMachineRecord(record: Buffer) {
    // FL4 ESDID machine instruction rec
    // FL4 statement number rec
    // FL4 location counter rec
    // XL8 reserve
    // FL4 instruction offset rec
    // FL4 instruction length rec
    // XL(n) value of the machine instruction
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
    const instructionOffset = record.readInt32BE(INSTRUCTION_OFFSET); // TODO(Kelosky): how you `should` offset to instruction
    const instructionLength = record.readInt32BE(INSTRUCTION_LENGTH);
    // const instructionLength = record.readInt32BE(INSTRUCTION_LENGTH);
    // console.log(LEN_STATEMENT_START)
    console.log();
    console.log(`esdid number is ${esdid}`);
    console.log(`statement number is ${statementNumber}`);
    console.log(`location counter is ${locationCounter}`);
    console.log(`instruction offset is ${instructionOffset}`);
    console.log(`instruction length is ${instructionLength}`);
    console.log(`instruction is: `);
    console.log(record.slice(INSTRUCTION_VALUE, INSTRUCTION_VALUE + instructionLength));
    // ${record.slice(INSTRUCTION_VALUE, INSTRUCTION_VALUE + instructionLength)}`);
    // console.log(record)
    console.log(`-----------`)
}