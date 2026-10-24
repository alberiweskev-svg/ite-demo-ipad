'use strict';
// Regression: employee editor must not depend on calendar IIFE private globals.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('const staffCalendarPalette=');
const end=source.indexOf('function contactEditor(id){',start);
assert(start>=0&&end>start,'Employee calendar color helper missing');
const section=source.slice(start,end);
assert(source.includes('name="agenda_color" value="'+String.fromCharCode(39)+'+staffCalendarColor(row)+'), 'Employee editor must use local color helper');
const rows=[{id:1,agenda_color:'#dce9ff'},{id:2,agenda_color:'#d9f5e5'}];
const context={ITE:{snapshot:()=>({clienti:rows})},Set,String};
vm.createContext(context);
vm.runInContext(section+';this.colorFor=staffCalendarColor',context);
assert.equal(context.colorFor({id:1,agenda_color:'#dce9ff'}),'#dce9ff','Keep existing color');
assert.equal(context.colorFor({id:3}),'#ffe6d5','New employee gets unused palette color');
assert.equal(context.colorFor({id:2,agenda_color:'invalid'}),'#d9f5e5','Editing employee may reuse own color');
assert.equal(context.colorFor({id:3,agenda_color:'#AbCdEf'}),'#AbCdEf','Preserve valid custom color');
assert.match(context.colorFor({id:3,agenda_color:'<script>'}),/^#[0-9a-f]{6}$/i,'Reject malformed color');
console.log('OK: employee color form uses scoped helper and retains safe colors');
