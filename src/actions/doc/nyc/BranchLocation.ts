import { Location } from "./Location";

export interface BranchLocation {
    type: "if" | "switch";
    line: number;
    locations: Location[];
}