export interface SourceAnalysisRecord {
    esdid: number;
    statementNumber: number;
    inputRecordNumber: number;
    parentRecordNumber: number;
    inputAssignedFileNumber: number;
    parentAssignedFileNumber: number;
    locationCounter: number;
    inputRecordOrigin: number;
    parentRecordOrigin: number;
    printFlags: number;
    // reserved: number;
    sourceRecordType: number;
    assemblerOperationCode: number;
    flags: number;
    // reserved: number;
    // address1: number;
    // reserved: number;
    // address2: number;
    offsetOfNameEntryInStatementField: number;
    lengthOfNameEntry: number;
    offsetOfOperationEntryInStatementField: number;
    lengthOfOperationEntry: number;
    offsetOfOperandEntryInStatementField: number;
    lengthOfOperandEntry: number;
    offsetOfRemarksEntryInStatementField: number;
    lengthOfRemarksEntry: number;
    offsetOfContinuationIndicatorField: number;
    // reserved: number;
    inputMacroOfCopyMemberNameOffset: number;
    inputMacroOfCopyMemberLengthOffset: number;
    parentMacroOfCopyMemberNameOffset: number;
    parentMacroOfCopyMemberLengthOffset: number;
    sourceRecordOffset: number;
    sourceRecordLength: number;
    // reserved: number;
    inputMacroOrCopyMemberName: string;
    parentMacroOrCopyMemberName: string;
    sourceRecord: string;
}