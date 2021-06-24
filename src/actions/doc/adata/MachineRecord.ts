export interface MachineRecord {
    esdid: number;
    statementNumber: number;
    locationCounter: number;
    instructionOffset: number;
    instructionLength: number;
    valueOfInstruction: number[];
    valueOfInstructionHex: string;
}