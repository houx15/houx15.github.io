// Fixed categories only: raw exceptions can contain provider payloads or credentials.
const providerReasons=new Map([
  ['Invalid stream','stream_headers'],['Invalid choices','stream_shape'],['Invalid choice','stream_order'],
  ['Mixed result','mixed_result'],['Changed result','changed_result'],['Invalid tool index','tool_format'],
  ['Invalid tool type','tool_format'],['Invalid tool delta','tool_format'],['Oversized tool','size_limit'],
  ['Oversized result','size_limit'],['Oversized stream','size_limit'],['Oversized frame','size_limit'],
  ['Truncated stream','truncated_stream'],['Invalid finish','finish_reason'],['Output token limit','output_limit'],['Invalid final','final_shape'],['Invalid biography identity','biography_identity']
]);
export function providerFailureCategory(error) {
  if(providerReasons.has(error?.message))return providerReasons.get(error.message);
  if(error?.name==='SyntaxError')return 'json_parse';
  if(['TimeoutError','AbortError'].includes(error?.name))return 'timeout';
  return 'provider_transport';
}
const categories=new Set([...providerReasons.values(),'json_parse','timeout','provider_transport']);
const runtimeReasons=new Map([
  ['Invalid biography identity','biography_identity'],['deadline','request_deadline'],['Invalid answer evidence','answer_evidence'],['Invalid answer delta','answer_delta'],['Changed answer','changed_answer'],
  ['Invalid tool call','tool_call'],['Invalid tool argument','tool_arguments'],['Missing tool argument','tool_arguments'],
  ['Invalid concept evidence','concept_evidence'],['Agent step budget exceeded','step_limit'],['Tool budget exceeded','tool_limit']
]);
const publicCodes=new Set(['invalid_request','invalid_session','challenge_failed','forbidden','not_found','unavailable','rate_limited','budget_exhausted','daily_budget_exhausted','monthly_budget_exhausted','context_limit','provider_unavailable','invalid_model_response']);
export function agentFailureRecord({requestId,stage,modelCalls,partial,error}) {
  return {event:'agent_failure',requestId:/^[a-f0-9-]{36}$/.test(requestId)?requestId:'unknown',
    stage:['request','model','agent','tool','finish'].includes(stage)?stage:'unknown',
    modelCalls:Number.isInteger(modelCalls)&&modelCalls>=0&&modelCalls<=6?modelCalls:0,partial:partial===true,
    category:categories.has(error?.diagnosticCategory)?error.diagnosticCategory:runtimeReasons.get(error?.message)||(error?.name==='AbortError'?'cancelled':null)||(publicCodes.has(error?.code)?error.code:'unexpected')};
}
