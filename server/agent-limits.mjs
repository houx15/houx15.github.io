// Shared by provider requests and accounting: reserve the full possible output.
export const MODEL_OUTPUT_TOKENS = 2048;
export const MODEL_WIRE_ALLOWANCE = 4096;
// A single longer diagram may take more than 15s; the whole request still has 45s.
export const MODEL_CALL_TIMEOUT_MS = 30000;
