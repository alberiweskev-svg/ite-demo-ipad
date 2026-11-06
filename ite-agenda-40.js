/* I.T.E. 4.0.44 — agenda TEST, date-safe and multi-day appointments. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.ITEAgenda40=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const pad=n=>String(n).padStart(2,'0');
function parseDay(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Data non valida');const [y,m,d]=s.split('-').map(Number);const x=new Date(Date.UTC(y,m-1,d));if(x.getUTCFullYear()!==y||x.getUTCMonth()+1!==m||x.getUTCDate()!==d)throw Error('Data non valida');return x}
function fmt(x){return x.getUTCFullYear()+'-'+pad(x.getUTCMonth()+1)+'-'+pad(x.getUTCDate())}
function plus(s,n){const d=parseDay(s);d.setUTCDate(d.getUTCDate()+n);return fmt(d)}
function monday(s){const d=parseDay(s);return plus(s,-((d.getUTCDay()+6)%7))}
function shiftMonth(s,n){const d=parseDay(s),target=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1));const max=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();target.setUTCDate(Math.min(d.getUTCDate(),max));return fmt(target)}
function range(s,view){parseDay(s);if(view==='day')return [s,plus(s,1)];if(view==='week'){const m=monday(s);return [m,plus(m,7)]}if(view==='month'){const start=s.slice(0,7)+'-01';return [start,shiftMonth(start,1)]}throw Error('Vista sconosciuta')}
function list(db,date,view,operatorId=''){if(!db||!Array.isArray(db.appointments))throw Error('Archivio appuntamenti mancante');const [start,end]=range(date,view),from=start+'T00:00:00',to=end+'T00:00:00';return db.appointments.filter(a=>a.status!=='CANCELLED'&&(!operatorId||a.operatorId===operatorId)&&typeof a.start==='string'&&typeof a.end==='string'&&a.start<to&&a.end>from).sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id)).map(a=>{const eq=(db.equipment||[]).find(x=>x.id===a.equipmentId),site=(db.sites||[]).find(x=>x.id===a.siteId),client=(db.clients||[]).find(x=>x.id===a.clientId),op=(db.operators||[]).find(x=>x.id===a.operatorId);return {...a,equipmentName:eq?.name||a.equipmentId,siteName:site?.name||a.siteId,clientName:client?.name||a.clientId,operatorName:op?.name||a.operatorId}})}
function grouped(rows,start,end){const out=Object.create(null);for(const a of rows){let d=a.start.slice(0,10);if(start&&d<start)d=start;const last=a.end.slice(0,10);for(let i=0;i<370&&d<=last&&(!end||d<end);i++,d=plus(d,1)){if(d===last&&a.end.slice(11,16)==='00:00')break;(out[d]||(out[d]=[])).push(a)}}return out}
function printable(rows){return rows.map(a=>[a.start.replace('T',' '),a.end.replace('T',' '),a.clientName,a.siteName,a.equipmentName,a.operatorName,a.status].join(' | ')).join('\n')}
return {monday,plus,shiftMonth,range,list,grouped,printable};
});