import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visitorAddress} from '../server/agent-address.mjs';
const request=(peer,value)=>({socket:{remoteAddress:peer},headers:{'x-portfolio-client-ip':value,'x-forwarded-for':'8.8.8.8'}});
test('visitor address ignores spoofed proxy headers unless explicitly configured',()=>{
 assert.equal(visitorAddress(request('203.0.113.3','192.0.2.1')),'203.0.113.3');
 assert.throws(()=>visitorAddress(request('203.0.113.3','192.0.2.1'),true),/forbidden/);
 for(const value of [undefined,'','192.0.2.1, 192.0.2.2',['192.0.2.1'],'anything'])assert.throws(()=>visitorAddress(request('127.0.0.1',value),true),/unavailable/);
});
test('trusted nginx distinguishes visitors and normalizes equivalent IP representations',()=>{
 assert.equal(visitorAddress(request('127.0.0.1','192.0.2.1'),true),'192.0.2.1');
 assert.notEqual(visitorAddress(request('127.0.0.1','192.0.2.1'),true),visitorAddress(request('127.0.0.1','192.0.2.2'),true));
 assert.equal(visitorAddress(request('::1','::ffff:192.0.2.1'),true),'192.0.2.1');
 assert.equal(visitorAddress(request('::1','2001:0db8:0:0:0:0:0:1'),true),'2001:db8::1');
});

test('IPv4-mapped IPv6 addresses share one quota key in every equivalent spelling',()=>{
 for(const value of ['::ffff:192.0.2.1','::FFFF:192.0.2.1','::ffff:c000:201','0:0:0:0:0:FFFF:C000:0201']) {
  assert.equal(visitorAddress(request('127.0.0.1',value),true),'192.0.2.1');
 }
});
