
export interface MetaDocument {
    earliestTerm: number;
    latestTerm: number;
}

export const DEFAULT_META: MetaDocument = {
    earliestTerm: Number.MAX_SAFE_INTEGER,
    latestTerm: Number.MIN_SAFE_INTEGER,
}
