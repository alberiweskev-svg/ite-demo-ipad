/* Integration regression: TEST-only, no real customer data. */
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname);
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const ui=fs.readFileSync(path.join(root,"ite-material-planning-ui-157.js"),"utf8");
const engine=require("./ite-material-planning-156.js");
assert.equal(typeof engine.plan,"function");
assert.equal(typeof engine.reserveAll,"function");
assert.equal(typeof engine.audit,"function");
for(const file of ["ite-inventory-154.js","ite-inventory-ui-155.js","ite-material-planning-156.js","ite-material-planning-ui-157.js"])assert.ok(html.includes(file),file+" missing in unified demo");
assert.ok(html.indexOf("ite-inventory-154.js")<html.indexOf("ite-material-planning-156.js"));
assert.ok(html.indexOf("ite-material-planning-156.js")<html.indexOf("ite-material-planning-ui-157.js"));
for(const text of ["ITE_UnifiedSession129","P.reserveAll","P.plan","P.audit","S.restore","line.kind!==\"FORNITURA\""])assert.ok(ui.includes(text),text);
assert.ok(!ui.includes("localStorage.setItem"),"no independent store");
assert.ok(!ui.includes("innerHTML"),"avoid untrusted HTML insertion");
console.log("4.0.157 integration checks passed");
