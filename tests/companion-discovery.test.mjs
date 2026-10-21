import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discoveryDocuments} from '../src/assets/companion-discovery.js';
const docs=[
 {id:'a',canonicalId:'notes/a',type:'notes',date:'2026-01-01',url:'/notes/a/'},
 {id:'b',canonicalId:'blog/b',type:'blog',date:'2026-10-19',url:'/blog/b/'},
 {id:'b-zh',canonicalId:'blog/b',type:'blog',date:'2026-10-19',url:'/zh/blog/b/'},
 {id:'p',canonicalId:'projects/p',type:'projects',date:'2026-10-20',url:'/projects/p/'}
];
test('latest writing excludes projects and selects one localized copy',()=>{
 assert.deepEqual(discoveryDocuments(docs,'latest','zh-CN').map(d=>d.id),['b-zh']);
 assert.deepEqual(discoveryDocuments(docs,'recent','en').map(d=>d.id),['b','a']);
});
test('project and surprise routes respect their scope, including empty collections',()=>{
 assert.deepEqual(discoveryDocuments(docs,'projects').map(d=>d.id),['p']);
 assert.deepEqual(discoveryDocuments(docs,'surprise','en',()=>.99).map(d=>d.id),['a']);
 assert.deepEqual(discoveryDocuments([],'surprise'),[]);
});
