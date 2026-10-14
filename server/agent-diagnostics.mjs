// Fixed categories only: raw exceptions can contain provider payloads or credentials.
const providerReasons=new Map([
  ['Invalid JSON root','json_root'],['Invalid stream','stream_headers'],['Invalid choices','stream_shape'],['Invalid choice','stream_order'],
  ['Mixed result','mixed_result'],['Changed result','changed_result'],['Invalid tool index','tool_format'],
  ['Invalid tool type','tool_format'],['Invalid tool delta','tool_format'],['Oversized tool','size_limit'],
  ['Oversized result','size_limit'],['Oversized stream','size_limit'],['Oversized frame','size_limit'],
  ['Truncated stream','truncated_stream'],['Invalid finish','finish_reason'],['Output token limit','output_limit'],['Invalid final','final_shape'],['Invalid biography identity','biography_identity']
]);
// Node fetch may wrap a transport failure in TypeError.cause. Keep only fixed
// categories, never cause.message, hostnames, addresses or provider bodies.
const transportReasons=new Map([
  ['UND_ERR_CONNECT_TIMEOUT','connection_timeout'],['UND_ERR_HEADERS_TIMEOUT','response_timeout'],['UND_ERR_BODY_TIMEOUT','response_timeout'],
  ['UND_ERR_SOCKET','connection_closed'],['ECONNRESET','connection_closed'],['EPIPE','connection_closed'],
  ['ENOTFOUND','dns_failure'],['EAI_AGAIN','dns_failure'],['ECONNREFUSED','connection_refused']
]);
export function providerFailureCategory(error) {
  if(providerReasons.has(error?.message))return providerReasons.get(error.message);
  if(error?.name==='SyntaxError')return 'json_parse';
  if(['TimeoutError','AbortError'].includes(error?.name))return 'timeout';
  return transportReasons.get(error?.cause?.code) || transportReasons.get(error?.code) || 'provider_transport';
}
const finalDetails=new Set(['nonobject_result','additional_fields','invalid_text_field','invalid_sources_field','changed_stream_text']);
const parseDetails=new Set(['stream_frame','tool_arguments','final_answer']);
export const providerFailureDetail=error=>(error?.message==='Invalid final' && finalDetails.has(error?.diagnosticDetail)) || (error?.name==='SyntaxError' && parseDetails.has(error?.diagnosticDetail))?error.diagnosticDetail:undefined;
const categories=new Set([...providerReasons.values(),...transportReasons.values(),'json_parse','timeout','provider_transport']);
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
    ...((error?.diagnosticCategory==='final_shape' && finalDetails.has(error?.diagnosticDetail)) || (error?.diagnosticCategory==='json_parse' && parseDetails.has(error?.diagnosticDetail))?{detail:error.diagnosticDetail}:{}),
    category:categories.has(error?.diagnosticCategory)?error.diagnosticCategory:runtimeReasons.get(error?.message)||(error?.name==='AbortError'?'cancelled':error?.name==='TimeoutError'?'request_deadline':null)||(publicCodes.has(error?.code)?error.code:'unexpected')};
}
