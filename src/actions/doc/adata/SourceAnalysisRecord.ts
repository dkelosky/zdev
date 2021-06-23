export interface SourceAnalysisRecord {
    esdid: number;
    statement: number;
    location: number;
    offset: number;
    length: number;
    instruction: number[];
}