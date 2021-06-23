import { MachineRecord } from "./MachineRecord";
import { SourceAnalysisRecord } from "./SourceAnalysisRecord";

export interface Adata {
    machineRecords: MachineRecord[];
    sourceAnalysisRecords?: SourceAnalysisRecord[];
}