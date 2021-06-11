import { Location } from "./Location";

export interface FunctionLocation extends Location {
    skip?: boolean;
    decl: Location;
    line?: number;
}