
import { readFile, mkdir, exists, stat, writeFile } from "fs";
import { sep, basename } from "path";
import { promisify, } from "util";
import { CACHE_SUFFIX, TXT_SUFFIX, WORK_COVERAGE_DIR, JSON_INDENT, ZCOV_INPUT_SUFFIX } from "../constants";
import { Adata } from "./doc/adata/Adata";
import { MachineRecord } from "./doc/adata/MachineRecord";
import { SourceAnalysisRecord } from "./doc/adata/SourceAnalysisRecord";

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
        await stats(WORK_COVERAGE_DIR);
    } catch (err) {
        await mdir(WORK_COVERAGE_DIR);
    }

    const data = await read(file);

    const records = []; // every record
    const adata: Adata = { // records we care about
        machineRecords: [],
        sourceAnalysisRecords: [],
    };

    let currIndex = 0;
    const LEN_INDEX_START = 10;
    const SOURCE_ANALYSIS_RECORD = 0x30;
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

        switch (type) {
            case SOURCE_ANALYSIS_RECORD:
                adata.sourceAnalysisRecords!.push(parseSourceAnalysisRecord(record));
                break;
            case MACHINE_INSTRUCTION_RECORD:
                adata.machineRecords.push(parseMachineRecord(record));
                break;

            default:
                //skip
                break;
        }

        currIndex = currIndex + ADATA_HEADER_LEN + len;
        if (currIndex >= data.length) break; // TODO(Kelosky): should probably break on end record??
    }

    // typeHash.forEach((type, value) => {
    //     console.log(`type is ${value}`);
    // });

    //
    // serialize adata as json
    //
    // await write(`${COVERAGE_DIR}${sep}${basename(file)}${CACHE_SUFFIX}`, JSON.stringify(adata, null, JSON_INDENT));
    // console.log(`... wrote ${COVERAGE_DIR}${sep}${basename(file)}${CACHE_SUFFIX}`);

    //
    // write data as text file
    //
    let flat = "";

    for (let i = 0; i < adata.machineRecords.length; i++) {
        flat += `${adata.machineRecords[i].statementNumber},${adata.machineRecords[i].locationCounter},${adata.machineRecords[i].instructionLength},${adata.machineRecords[i].valueOfInstruction}\n`;
    }

    await write(`${WORK_COVERAGE_DIR}${sep}${basename(file)}${ZCOV_INPUT_SUFFIX}`, flat);
    console.log(`... wrote ${WORK_COVERAGE_DIR}${sep}${basename(file)}${ZCOV_INPUT_SUFFIX}`);

    await write(`${WORK_COVERAGE_DIR}${sep}${basename(file)}${CACHE_SUFFIX}`, JSON.stringify(adata, null, JSON_INDENT));;
    console.log(`... wrote ${WORK_COVERAGE_DIR}${sep}${basename(file)}${CACHE_SUFFIX}`);

}

/**
 * x'0030' Machine instruction rec layout:
 * =======================================
 * FL4 ESDID
 * FL4 statement number
 * FL4 input record number
 * FL4 parent record number
 * FL4 input assigned file number
 * FL4 parent assigned file number
 * FL4 location counter
 * XL1 input record origin
 * XL1 parent record origin
 * XL1 print flags
 * XL2 reserved
 * XL1 source record type
 * XL1 assembler operation code
 * XL1 flags
 * AL4 reserved
 * AL4 address 1
 * AL4 reserved
 * AL4 address 2
 * FL4 offset of name entry in statement field
 * FL4 length of name entry
 * FL4 offset of operation entry in statement field
 * FL4 length of operation entry
 * FL4 offset of operand in statement field
 * FL4 length of operand entry
 * FL4 offset of remarks in statement field
 * FL4 length of remarks entry
 * FL4 offset of continuation indicator field
 * XL4 reserved
 * FL4 input macro of copy member name offset
 * FL4 input macro or copy member name length
 * FL4 parent macro of copy member name offset
 * FL4 parent macro or copy member name length
 * FL4 source record offset
 * FL4 source record length
 * XL8 reserved
 * CL(n) input macro or copy member name
 * CL(n) parent macro or copy member name
 * CL(n) source record
 */
function parseSourceAnalysisRecord(record: Buffer): SourceAnalysisRecord {

    const INDEX_ESDID = ADATA_HEADER_LEN;
    const INDEX_STATEMENT_NUMBER = INDEX_ESDID + 4;
    const INDEX_INPUT_RECORD_NUMBER = INDEX_STATEMENT_NUMBER + 4;
    const INDEX_PARENT_RECORD_NUMBER = INDEX_INPUT_RECORD_NUMBER + 4;
    const INDEX_INPUT_ASSIGNED_FILE_NUMBER = INDEX_PARENT_RECORD_NUMBER + 4;
    const INDEX_PARENT_ASSIGNED_FILE_NUMBER = INDEX_INPUT_ASSIGNED_FILE_NUMBER + 4;
    const INDEX_LOCATION_COUNTER = INDEX_PARENT_ASSIGNED_FILE_NUMBER + 4;
    const INDEX_INPUT_RECORD_ORIGIN = INDEX_LOCATION_COUNTER + 4;
    const INDEX_PARENT_RECORD_ORIGIN = INDEX_INPUT_RECORD_ORIGIN + 1;
    const INDEX_PRINT_FLAGS = INDEX_PARENT_RECORD_ORIGIN + 1;
    const INDEX_RESERVED0 = INDEX_PRINT_FLAGS + 1;
    const INDEX_SOURCE_RECORD_TYPE = INDEX_RESERVED0 + 2;
    const INDEX_ASSEMBLER_OPERATION_CODE = INDEX_SOURCE_RECORD_TYPE + 1;
    const INDEX_FLAGS = INDEX_ASSEMBLER_OPERATION_CODE + 1;
    const INDEX_RESERVED1 = INDEX_FLAGS + 1;
    const INDEX_ADDRESS1 = INDEX_RESERVED1 + 4;
    const INDEX_RESERVED3 = INDEX_ADDRESS1 + 4;
    const INDEX_ADDRESS2 = INDEX_RESERVED3 + 4;
    const INDEX_OFFSET_OF_NAME_ENTRY_IN_STATEMENT_FIELD = INDEX_ADDRESS2 + 4;
    const INDEX_LENGTH_OF_NAME_ENTRY = INDEX_OFFSET_OF_NAME_ENTRY_IN_STATEMENT_FIELD + 4;
    const INDEX_OFFSET_OF_OPERATION_ENTRY_IN_STATEMENT_FIELD = INDEX_LENGTH_OF_NAME_ENTRY + 4;
    const INDEX_LENGTH_OF_OPERATION_ENTRY = INDEX_OFFSET_OF_OPERATION_ENTRY_IN_STATEMENT_FIELD + 4;
    const INDEX_OFFSET_OF_OPERAND_ENTRY_IN_STATEMENT_FIELD = INDEX_LENGTH_OF_OPERATION_ENTRY + 4;
    const INDEX_LENGTH_OF_OPERAND_ENTRY = INDEX_OFFSET_OF_OPERAND_ENTRY_IN_STATEMENT_FIELD + 4;
    const INDEX_OFFSET_OF_REMARKS_ENTRY_IN_STATEMENT_FIELD = INDEX_LENGTH_OF_OPERAND_ENTRY + 4;
    const INDEX_LENGTH_OF_REMARKS_ENTRY = INDEX_OFFSET_OF_REMARKS_ENTRY_IN_STATEMENT_FIELD + 4;
    const INDEX_OFFSET_OF_CONTINUATION_INDICATOR_FIELD = INDEX_LENGTH_OF_REMARKS_ENTRY + 4;
    const INDEX_RESERVED4 = INDEX_OFFSET_OF_CONTINUATION_INDICATOR_FIELD + 4;
    const INDEX_INPUT_MACRO_OF_COPY_MEMBER_NAME_OFFSET = INDEX_RESERVED4 + 4;
    const INDEX_INPUT_MACRO_OF_COPY_MEMBER_NAME_LENGTH = INDEX_INPUT_MACRO_OF_COPY_MEMBER_NAME_OFFSET + 4;
    const INDEX_PARENT_MACRO_OF_COPY_MEMBER_NAME_OFFSET = INDEX_INPUT_MACRO_OF_COPY_MEMBER_NAME_LENGTH + 4;
    const INDEX_PARENT_MACRO_OF_COPY_MEMBER_NAME_LENGTH = INDEX_PARENT_MACRO_OF_COPY_MEMBER_NAME_OFFSET + 4;
    const INDEX_SOURCE_RECORD_OFFSET = INDEX_PARENT_MACRO_OF_COPY_MEMBER_NAME_LENGTH + 4;
    const INDEX_SOURCE_RECORD_LENGTH = INDEX_SOURCE_RECORD_OFFSET + 4;
    const INDEX_RESERVED5 = INDEX_SOURCE_RECORD_LENGTH + 4;
    const INDEX_INPUT_MACRO_OR_COPY_MEMBER_NAME = INDEX_RESERVED5 + 8;

    const esdid = record.readInt32BE(INDEX_ESDID);
    const statementNumber = record.readInt32BE(INDEX_STATEMENT_NUMBER);
    const inputRecordNumber = record.readInt32BE(INDEX_INPUT_RECORD_NUMBER);
    const parentRecordNumber = record.readInt32BE(INDEX_PARENT_RECORD_NUMBER);
    const inputAssignedFileNumber = record.readInt32BE(INDEX_INPUT_ASSIGNED_FILE_NUMBER);
    const parentAssignedFileNumber = record.readInt32BE(INDEX_PARENT_ASSIGNED_FILE_NUMBER);
    const locationCounter = record.readInt32BE(INDEX_LOCATION_COUNTER);
    const inputRecordOrigin = record.readUInt8(INDEX_INPUT_RECORD_ORIGIN);
    const parentRecordOrigin = record.readUInt8(INDEX_PARENT_RECORD_ORIGIN);
    const printFlags = record.readUInt8(INDEX_PRINT_FLAGS);
    const sourceRecordType = record.readUInt8(INDEX_SOURCE_RECORD_TYPE);
    const assemblerOperationCode = record.readUInt8(INDEX_ASSEMBLER_OPERATION_CODE);
    const flags = record.readUInt8(INDEX_FLAGS);
    const offsetOfNameEntryInStatementField = record.readInt32BE(INDEX_OFFSET_OF_NAME_ENTRY_IN_STATEMENT_FIELD);
    const lengthOfNameEntry = record.readInt32BE(INDEX_LENGTH_OF_NAME_ENTRY);
    const offsetOfOperationEntryInStatementField = record.readInt32BE(INDEX_OFFSET_OF_OPERATION_ENTRY_IN_STATEMENT_FIELD);
    const lengthOfOperationEntry = record.readInt32BE(INDEX_LENGTH_OF_OPERATION_ENTRY);
    const offsetOfOperandEntryInStatementField = record.readInt32BE(INDEX_OFFSET_OF_OPERAND_ENTRY_IN_STATEMENT_FIELD);
    const lengthOfOperandEntry = record.readInt32BE(INDEX_LENGTH_OF_OPERAND_ENTRY);
    const offsetOfRemarksEntryInStatementField = record.readInt32BE(INDEX_OFFSET_OF_REMARKS_ENTRY_IN_STATEMENT_FIELD);
    const lengthOfRemarksEntry = record.readInt32BE(INDEX_LENGTH_OF_REMARKS_ENTRY);
    const offsetOfContinuationIndicatorField = record.readInt32BE(INDEX_OFFSET_OF_CONTINUATION_INDICATOR_FIELD);
    const inputMacroOfCopyMemberNameOffset = record.readInt32BE(INDEX_INPUT_MACRO_OF_COPY_MEMBER_NAME_OFFSET);
    const inputMacroOfCopyMemberLengthOffset = record.readInt32BE(INDEX_INPUT_MACRO_OF_COPY_MEMBER_NAME_LENGTH);
    const parentMacroOfCopyMemberNameOffset = record.readInt32BE(INDEX_PARENT_MACRO_OF_COPY_MEMBER_NAME_OFFSET);
    const parentMacroOfCopyMemberLengthOffset = record.readInt32BE(INDEX_PARENT_MACRO_OF_COPY_MEMBER_NAME_LENGTH);
    const sourceRecordOffset = record.readInt32BE(INDEX_SOURCE_RECORD_OFFSET);
    const sourceRecordLength = record.readInt32BE(INDEX_SOURCE_RECORD_LENGTH);

    // console.log(`1 length is ${INDEX_LOCATION_COUNTER}`)
    // console.log(`length is ${INDEX_INPUT_RECORD_ORIGIN}`)

    const sourceAnalysisRec: SourceAnalysisRecord = {
        esdid,
        statementNumber,
        inputRecordNumber,
        parentRecordNumber,
        inputAssignedFileNumber,
        parentAssignedFileNumber,
        locationCounter,
        inputRecordOrigin,
        parentRecordOrigin,
        printFlags,
        sourceRecordType,
        assemblerOperationCode,
        flags,
        offsetOfNameEntryInStatementField,
        lengthOfNameEntry,
        offsetOfOperationEntryInStatementField,
        lengthOfOperationEntry,
        offsetOfOperandEntryInStatementField,
        lengthOfOperandEntry,
        offsetOfRemarksEntryInStatementField,
        lengthOfRemarksEntry,
        offsetOfContinuationIndicatorField,
        inputMacroOfCopyMemberNameOffset,
        inputMacroOfCopyMemberLengthOffset,
        parentMacroOfCopyMemberNameOffset,
        parentMacroOfCopyMemberLengthOffset,
        sourceRecordOffset,
        sourceRecordLength,
        inputMacroOrCopyMemberName: "fakename",
        parentMacroOrCopyMemberName: "fakemember",
        sourceRecord: "fake record",
    };

    return sourceAnalysisRec;
}

/**
 * x'0036' Machine instruction rec layout:
 * =======================================
 * FL4 ESDID
 * FL4 statement number
 * FL4 location counter
 * XL8 reserved
 * FL4 instruction offset
 * FL4 instruction length
 * XL(n) value of instruction
 */
function parseMachineRecord(record: Buffer): MachineRecord {

    const INDEX_ESDID = ADATA_HEADER_LEN;
    const INDEX_STATEMENT_NUMBER = INDEX_ESDID + 4;
    const INDEX_LOCATION_COUNTER = INDEX_STATEMENT_NUMBER + 4;
    const INDEX_RESERVED = INDEX_LOCATION_COUNTER + 4;
    const INDEX_INSTRUCTION_OFFSET = INDEX_RESERVED + 8;
    const INDEX_INSTRUCTION_LENGTH = INDEX_INSTRUCTION_OFFSET + 4;
    const INDEX_VALUE_OF_INSTRUCTION = INDEX_INSTRUCTION_LENGTH + 4;

    const esdid = record.readInt32BE(INDEX_ESDID);
    const statementNumber = record.readInt32BE(INDEX_STATEMENT_NUMBER);
    const locationCounter = record.readInt32BE(INDEX_LOCATION_COUNTER);
    const instructionOffset = record.readInt32BE(INDEX_INSTRUCTION_OFFSET); // TODO(Kelosky): how you `should` offset to instruction, e.g. using offset rec
    const instructionLength = record.readInt32BE(INDEX_INSTRUCTION_LENGTH);

    const machRec: MachineRecord = {
        esdid,
        statementNumber,
        locationCounter,
        instructionOffset,
        instructionLength,
        valueOfInstruction: [],
        valueOfInstructionHex: "",
    };

    // read in 2 bytes at a time
    const lenToRead = instructionLength / 2;
    for (let i = 0; i < lenToRead; i++) {
        machRec.valueOfInstruction.push(record.readUInt16BE(INDEX_VALUE_OF_INSTRUCTION + i * 2));
    }

    let str = "";
    for (let i = 0; i < lenToRead; i++) {
        const pre = "0000" + machRec.valueOfInstruction[i].toString(16);
        str += pre.substr(pre.length - 4) + " ";
    }
    machRec.valueOfInstructionHex = str.trim().toUpperCase();

    return machRec;

}