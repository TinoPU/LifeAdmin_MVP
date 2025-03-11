import {ValueObject} from "./WAIncomingValueObject";

export interface WAIncomingObject {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: ValueObject;
            field: string;
        }>;
    }>;
}