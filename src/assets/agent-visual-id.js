// Stable diagram references are separate from request-scoped SSE block IDs.
export const isVisualId=value=>typeof value==='string' && /^concept-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(value);
