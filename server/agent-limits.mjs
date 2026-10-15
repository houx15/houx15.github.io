// Shared by provider requests and accounting: reserve the full possible output.
export const MODEL_OUTPUT_TOKENS = 2048;
export const MODEL_WIRE_ALLOWANCE = 4096;
// A single longer diagram may take more than 15s; the whole request still has 45s.
export const MODEL_CALL_TIMEOUT_MS = 30000;

// Total context budget for the configured Qwen 3.8 Max deployment. This is
// tokens, not bytes. Leave both output and wire/protocol headroom.
export const MODEL_CONTEXT_TOKENS = 200000;
export const MODEL_CONTEXT_INPUT_TOKENS = MODEL_CONTEXT_TOKENS - MODEL_OUTPUT_TOKENS - MODEL_WIRE_ALLOWANCE;

// Conservative heuristic for natural-language site content, not an exact model
// tokenizer: ASCII ~3 characters/token; non-ASCII 2 tokens/code point. The wire
// allowance above covers provider wrappers and tool-call protocol instructions.
export function estimateContextTokens(messages,tools) {
  const serialized=JSON.stringify({messages,tools});let ascii=0,other=0;
  for(const char of serialized)char.codePointAt(0)<128?ascii++:other++;
  return Math.ceil(ascii/3)+other*2;
}
