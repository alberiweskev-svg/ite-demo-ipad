/* ITE 4.0.298: integrated synthetic workspace. No production archive access. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./workflow296.js'):root.ITEWorkflow296,typeof module==='object'&&module.exports?require('./operations297.js'):root.ITEOperations297);if(typeof module==='object'&&module.exports)module.exports=api;else root.ITEWorkspace298=api;})(typeof globalThis!=='undefined'?globalThis:this,function(w,o){
'use strict';
const KEY='ITE_WORKSPACE_298_TEST',copy=x=>JSON.parse(JSON.stringify(x));
const ensure=(x,m)=>{if(!x)throw Error(m);};
const text=x=>typeof x==='string'&&x.trim().length>0;
const date=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
const cents=x=>{const n=Math.round((x+Number.EPSILON)*100);ensure(Number.isSafeInteger(n)&&n>=0,'Importo fuori limite');return n;};
function blank(){return {...o.init(w.empty()),workspace:'4.0.298',documenti:[]};}
function validate(db){
 o.validate(db);ensure(db.workspace==='4.0.298'&&Array.isArray(db.documenti),'Archivio workspace 4.0.298 richiesto');
 for(const t of ['clienti','sedi','impianti','apparecchiature','interventi'])for(const x of db.workflow[t])ensure(text(x.nome),'Nome obbligatorio: '+t);
 for(const a of db.workflow.appuntamenti)ensure(text(a.operatore)&&date(a.inizio)&&date(a.fine),'Agenda: operatore e orari con fuso richiesti');
 ensure(w.conflicts(db.workflow).length===0,'Sovrapposizione agenda operatore');
 for(const p of db.workflow.preventivi){ensure(text(p.nome)&&p.voci.length>0,'Preventivo senza nome o righe');for(const v of p.voci)cents(v.quantita*v.prezzo);}
 const active=new Set();
 for(const r of db.rapporti){ensure(date(r.arrivo),'Arrivo non valido');if(r.stato==='arrivato'){ensure(!active.has(r.interventoId),'Rapporto già in corso');active.add(r.interventoId);}if(r.stato==='chiuso')ensure(date(r.uscita)&&text(r.descrizione),'Chiusura incompleta');}
 for(const f of db.workflow.fatture){ensure(db.workflow.preventivi.some(p=>p.id===f.preventivoId),'Documento senza preventivo');const m=db.movimenti.filter(m=>m.fatturaId===f.id);ensure(m.length===1&&m[0].tipo===f.tipo,'Movimento documento incoerente');if(f.tipo==='TD04'){const original=db.workflow.fatture.find(x=>x.id===f.documentoRiferimento);ensure(original&&original.tipo==='vendita'&&original.preventivoId===f.preventivoId,'TD04 non collegata alla stessa commessa');const issued=db.workflow.fatture.filter(x=>x.tipo==='TD04'&&x.documentoRiferimento===original.id).reduce((n,x)=>n+db.movimenti.find(m=>m.fatturaId===x.id).centesimi,0);ensure(issued<=db.movimenti.find(m=>m.fatturaId===original.id).centesimi,'TD04 oltre importo vendita');}}
 const ids=new Set();for(const d of db.documenti){ensure(typeof d.id==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(d.id)&&!ids.has(d.id),'ID documento duplicato o non valido');ids.add(d.id);ensure(db.workflow.interventi.some(i=>i.id===d.interventoId),'Intervento documento mancante');ensure(['DICO','DIRI','POS','CAD','GAS','ALLEGATO'].includes(d.tipo)&&text(d.nome)&&/\.pdf$/i.test(d.nome),'Metadati PDF non validi');}
 for(const m of db.movimenti)ensure(db.workflow.fatture.some(f=>f.id===m.fatturaId&&f.tipo===m.tipo),'Movimento senza documento coerente');
 return true;
}
function mutate(db,revision,action,fn){validate(db);ensure(db.revision===revision,'Conflitto revisione: ricaricare');const n=copy(db);fn(n);n.revision++;n.audit.push({revision:n.revision,azione:action});validate(n);return n;}
function upsert(db,rev,type,item){ensure(['clienti','sedi','impianti','apparecchiature','interventi','appuntamenti','preventivi'].includes(type),'Archivio non modificabile');return mutate(db,rev,'salva-'+type,n=>{const old=n.workflow[type].find(x=>x.id===item.id);if(old){const {id,...patch}=item;n.workflow=w.update(n.workflow,type,id,patch);}else n.workflow=w.insert(n.workflow,type,item);});}
function operation(db,rev,method,...args){validate(db);ensure(['arrive','close','addExtra','decideExtra','recordDocument'].includes(method),'Operazione non ammessa');const next=o[method](db,rev,...args);validate(next);return next;}
function attach(db,rev,item){return mutate(db,rev,'metadati-PDF',n=>n.documenti.push(copy(item)));}
function dossier(db,id){validate(db);const s=o.summary(db,id),quoteIds=new Set(s.fascicolo.preventivi.map(p=>p.id)),docs=db.workflow.fatture.filter(f=>quoteIds.has(f.preventivoId));const totals={fornitura:0,posa:0,smontaggio:0,smaltimento:0,extra:0};for(const p of s.fascicolo.preventivi)for(const v of p.voci)totals[v.tipo]+=cents(v.quantita*v.prezzo);for(const e of s.extra.filter(e=>e.stato==='approvato'))totals[e.tipo]+=cents(e.quantita*e.prezzo);const ledger={vendita:0,acquisto:0,proforma:0,TD04:0};for(const f of docs)ledger[f.tipo]+=db.movimenti.find(m=>m.fatturaId===f.id).centesimi;return {...s,documentiTecnici:db.documenti.filter(d=>d.interventoId===id).map(copy),totaliCentesimi:totals,contabilita:{...ledger,nettoVendite:ledger.vendita-ledger.TD04}};}
function decode(raw){ensure(typeof raw==='string'&&raw.length<5000000,'Backup troppo grande');const n=JSON.parse(raw);validate(n);return copy(n);}
function encode(db){validate(db);return JSON.stringify(db);}
function open(storage){const raw=storage.getItem(KEY);return raw===null?blank():decode(raw);}
// Readback before exposing a new state; retain the exact previous bytes for rollback.
function persist(storage,previous,next){validate(previous);validate(next);const before=storage.getItem(KEY);ensure(before===null?previous.revision===0:encode(decode(before))===encode(previous),'Archivio modificato in altra scheda: ricaricare');const raw=encode(next);try{storage.setItem(KEY,raw);ensure(storage.getItem(KEY)===raw,'Verifica salvataggio fallita');}catch(e){try{if(before===null)storage.removeItem(KEY);else storage.setItem(KEY,before);}catch(rollback){throw Error('Salvataggio e ripristino non riusciti: riaprire e verificare il backup. '+rollback.message);}throw e;}return copy(next);}
function demo(){let d=blank();for(const [t,x] of [['clienti',{id:'c_test',nome:'Cliente TEST'}],['sedi',{id:'s_test',nome:'Sede TEST',clienteId:'c_test'}],['impianti',{id:'p_test',nome:'Impianto TEST',sedeId:'s_test'}],['apparecchiature',{id:'a_test',nome:'Caldaia TEST',impiantoId:'p_test'}],['interventi',{id:'i_test',nome:'Manutenzione TEST',apparecchiaturaId:'a_test'}],['appuntamenti',{id:'ag_test',interventoId:'i_test',operatore:'Tecnico TEST',inizio:'2026-11-26T09:00:00+01:00',fine:'2026-11-26T10:30:00+01:00'}],['preventivi',{id:'q_test',nome:'Preventivo TEST',interventoId:'i_test',voci:[{tipo:'fornitura',quantita:1,prezzo:120},{tipo:'posa',quantita:2,prezzo:58}]}]])d=upsert(d,d.revision,t,x);return d;}
return {KEY,blank,validate,upsert,operation,attach,dossier,decode,encode,open,persist,demo};
});
