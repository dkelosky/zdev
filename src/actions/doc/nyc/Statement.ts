import { Location } from "./Location";

export interface StatementLocation extends Location {
    skip?: boolean;
}