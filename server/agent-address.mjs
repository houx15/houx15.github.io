import {isIP} from 'node:net';
import {AgentError} from './agent-state.mjs';

// Enable only behind our loopback nginx, which must overwrite this header.
// Never use visitor-supplied X-Forwarded-For or trust arbitrary network peers.
export function visitorAddress(req,trustLoopbackProxy=false) {
  const peer=req.socket.remoteAddress || 'unknown';
  if(!trustLoopbackProxy)return peer;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(peer))throw new AgentError(403,'forbidden');
  const value=req.headers['x-portfolio-client-ip'];
  if(typeof value!=='string' || !isIP(value))throw new AgentError(503,'unavailable');
  if(value.startsWith('::ffff:') && isIP(value.slice(7))===4)return value.slice(7);
  return isIP(value)===6?new URL(`http://[${value}]/`).hostname.slice(1,-1):value;
}
