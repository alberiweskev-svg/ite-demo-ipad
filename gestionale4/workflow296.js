/* I.T.E. 4.0.296 — motore integrato commesse TEST, nessun dato reale. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ITEWorkflow296=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TYPES=['clienti','sedi','impianti','apparecchiature','interventi','appuntamenti','preventivi','fatture'];
const copy=x=>JSON.parse(JSON.stringify(x));
const validId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(x);
const euro=x=>Math.round((Number(x)+Number.EPSILON)*100)/100;
const assert=(v,msg)=>{if(!v)throw Error(msg);};
const find=(s,t,id)=>s[t].find(x=>x.id===id);
const iso=x=>typeof x==='string'&&!Number.isNaN(Date.parse(x));
function empty(){return Object.fromEntries(TYPES.map(t=>[t,[]]));}
function check(s){assert(s&&TYPES.every(t=>Array.isArray(s[t])),'Archivio non valido');
for(const t of TYPES){const ids=new Set();for(const x of s[t]){assert(validId(x.id),'ID non valido: '+t);assert(!ids.has(x.id),'ID duplicato: '+t);ids.add(x.id);}}
const relation=(t,parent,key)=>{for(const x of s[t])assert(find(s,parent,x[key]),'Riferimento mancante: '+t+'.'+key);};
relation('sedi','clienti','clienteId');relation('impianti','sedi','sedeId');relation('apparecchiature','impianti','impiantoId');
relation('interventi','apparecchiature','apparecchiaturaId');relation('appuntamenti','interventi','interventoId');relation('preventivi','interventi','interventoId');
for(const x of s.fatture){assert(['acquisto','vendita','proforma','TD04'].includes(x.tipo),'Tipo documento non valido');if(x.preventivoId)assert(find(s,'preventivi',x.preventivoId),'Preventivo fattura mancante');}
for(const a of s.appuntamenti){assert(a.operatore&&typeof a.operatore==='string','Operatore obbligatorio');assert(iso(a.inizio)&&iso(a.fine)&&Date.parse(a.fine)>Date.parse(a.inizio),'Intervallo non valido');}
for(const p of s.preventivi){assert(Array.isArray(p.voci),'Voci mancanti');for(const v of p.voci){assert(['fornitura','posa','smontaggio','smaltimento','extra'].includes(v.tipo),'Tipo voce non valido');assert(Number.isFinite(v.quantita)&&v.quantita>0&&Number.isFinite(v.prezzo)&&v.prezzo>=0,'Importo non valido');}}
return true;}
function insert(state,type,item){assert(TYPES.includes(type),'Archivio sconosciuto');const next=copy(state);assert(item&&validId(item.id),'ID non valido');next[type].push(copy(item));check(next);return next;}
function update(state,type,id,patch){assert(TYPES.includes(type),'Archivio sconosciuto');assert(patch&&typeof patch==='object'&&!Array.isArray(patch),'Modifica non valida');const next=copy(state),i=next[type].findIndex(x=>x.id===id);assert(i>=0,'Record inesistente');assert(!Object.prototype.hasOwnProperty.call(patch,'id'),'ID immutabile');next[type][i]={...next[type][i],...copy(patch)};check(next);return next;}
function timeline(state,operatore){check(state);return state.appuntamenti.filter(a=>!operatore||a.operatore===operatore).map(a=>({...copy(a),minuti:(Date.parse(a.fine)-Date.parse(a.inizio))/60000})).sort((a,b)=>a.inizio.localeCompare(b.inizio));}
function conflicts(state){const list=timeline(state),out=[];for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j];if(a.operatore===b.operatore&&Date.parse(a.inizio)<Date.parse(b.fine)&&Date.parse(b.inizio)<Date.parse(a.fine))out.push({operatore:a.operatore,appuntamenti:[a.id,b.id]});}return out;}
function totals(state,id){check(state);const p=find(state,'preventivi',id);assert(p,'Preventivo inesistente');const byType={fornitura:0,posa:0,smontaggio:0,smaltimento:0,extra:0};for(const v of p.voci)byType[v.tipo]=euro(byType[v.tipo]+euro(v.quantita*v.prezzo));return {...byType,totale:euro(Object.values(byType).reduce((a,b)=>a+b,0))};}
function dossier(state,interventoId){check(state);const i=find(state,'interventi',interventoId);assert(i,'Intervento inesistente');const a=find(state,'apparecchiature',i.apparecchiaturaId),impianto=find(state,'impianti',a.impiantoId),sede=find(state,'sedi',impianto.sedeId),cliente=find(state,'clienti',sede.clienteId);return {cliente:copy(cliente),sede:copy(sede),impianto:copy(impianto),apparecchiatura:copy(a),intervento:copy(i),appuntamenti:timeline(state).filter(x=>x.interventoId===interventoId),preventivi:state.preventivi.filter(x=>x.interventoId===interventoId).map(x=>({...copy(x),totali:totals(state,x.id)})),fatture:state.fatture.filter(x=>state.preventivi.some(p=>p.id===x.preventivoId&&p.interventoId===interventoId)).map(copy)};}
function exportTest(state){check(state);return JSON.stringify({schema:'ite-workflow-4.0.296',testOnly:true,data:state});}
function importTest(raw){assert(typeof raw==='string'&&raw.length<5000000,'Archivio troppo grande');const parsed=JSON.parse(raw);assert(parsed.schema==='ite-workflow-4.0.296'&&parsed.testOnly===true,'Formato non ammesso');check(parsed.data);return copy(parsed.data);}
return {empty,check,insert,update,timeline,conflicts,totals,dossier,exportTest,importTest};
});
