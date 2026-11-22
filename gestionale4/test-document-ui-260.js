'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
for(const needle of ['docFlow.preview(before,[item])','docFlow.preview(snapshot,entries)','docFlow.siteOverview(s)','if(prior[key])item[key]=prior[key]'])assert(html.includes(needle),'UI missing: '+needle);
assert(html.includes('document-workflow-258.js'));
console.log('PASS document UI preflight and revision scope integration');
