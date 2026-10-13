import { AgentError } from './agent-state.mjs';
import { MODEL_OUTPUT_TOKENS, MODEL_WIRE_ALLOWANCE } from './agent-limits.mjs';

// Both HTTP and SSH tests reserve against the same monetary ledger before every call.
export function createPaidCompletion({guard,requestId,complete,signal,beforeCall=()=>{},afterCall=()=>{}}) {
  return async args=>{
    signal.throwIfAborted();
    const bytes=Buffer.byteLength(JSON.stringify({messages:args.messages,tools:args.tools}));
    if(bytes>48000) throw new AgentError(400,'context_limit');
    const reservation=await guard.reserve(requestId,bytes+MODEL_WIRE_ALLOWANCE+MODEL_OUTPUT_TOKENS);
    signal.throwIfAborted();beforeCall();
    const result=await complete(args);signal.throwIfAborted();
    const usage=result.usage;
    const valid=Number.isSafeInteger(usage?.prompt_tokens) && usage.prompt_tokens>=0 && Number.isSafeInteger(usage?.completion_tokens) && usage.completion_tokens>=0 && usage.completion_tokens<=MODEL_OUTPUT_TOKENS && usage.total_tokens===usage.prompt_tokens+usage.completion_tokens;
    await guard.reconcile(reservation,valid?usage.total_tokens:undefined);
    signal.throwIfAborted();afterCall();return result;
  };
}
