'use strict';
/* Integrated demo startup checks, no customer data or PDF fixtures. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'gestionale4/index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?\ssrc="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1]);
assert(scripts.length>=8,'Missing integrated modules');
for(const src of scripts){
 assert(!/^https?:|^\/\//i.test(src),'Unexpected remote script: '+src);
 const p=path.resolve(__dirname,'gestionale4',src);
 assert(p.startsWith(__dirname+path.sep),'Script escapes repository');
 assert(fs.existsSync(p),'Missing browser dependency: '+src);
 new vm.Script(fs.readFileSync(p,'utf8'),{filename:p});
}
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(x=>x.trim());
assert(inline.length>0,'No application bootstrap script');
for(const code of inline)new vm.Script(code,{filename:'gestionale4/index.html'});
for(const name of ['ITEIntegratedCore225','ITEAgenda227','ITERecovery234','ITECommercial240','ITEDocumentWorkspace237']){
 assert(html.includes(name),'Missing module reference: '+name);
}
assert(html.includes('id="view"')&&html.includes('id="nav"'),'Missing app mount points');
assert(!/<script[^>]*src="https?:/i.test(html),'External script not allowed in offline demo');
console.log('Integrated demo: '+scripts.length+' local modules present; inline bootstrap parses; mounts present.');
