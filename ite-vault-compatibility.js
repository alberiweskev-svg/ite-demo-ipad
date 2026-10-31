/* Read-only diagnostic for the actual I.T.E. vault topology. */
(function(root){'use strict';
const rows=x=>Array.isArray(x)?x:[];
const key=x=>String(x??'');
function inspect(core,commerce){
 if(!core||!commerce)throw Error('Archivi obbligatori');
 const issues=[],names=['clienti','immobili','impianti','apparecchiature','interventi','appuntamenti'];
 for(const n of names)if(!Array.isArray(core[n]))issues.push('Archivio mancante: '+n);
 for(const n of ['documents','audit'])if(!Array.isArray(commerce[n]))issues.push('Archivio commercio mancante: '+n);
 const has=(n,id)=>rows(core[n]).some(x=>key(x.id)===key(id));
 for(const [name,foreign,parent] of [['immobili','client_id','clienti'],['impianti','immobile_id','immobili'],['apparecchiature','impianto_id','impianti']]){
  for(const x of rows(core[name]))if(!has(parent,x[foreign]))issues.push('Collegamento incoerente: '+name+'/'+key(x.id));
 }
 for(const name of names){const seen=new Set();for(const x of rows(core[name])){if(!key(x.id)||seen.has(key(x.id)))issues.push('Identificativo duplicato: '+name);seen.add(key(x.id))}}
 for(const x of rows(core.interventi))if(x.appointmentId&&!has('appuntamenti',x.appointmentId))issues.push('Appuntamento non trovato: '+key(x.id));
 if(!Number.isInteger(commerce.revision))issues.push('Revisione commercio non valida');
 return {readOnly:true,compatible:issues.length===0,issues,counts:Object.fromEntries(names.map(n=>[n,rows(core[n]).length])),revision:commerce.revision,
 topology:['ITEVault.storage','ITE_COMMERCIO_V1/state+journal','ITE_DEMO_DOCUMENTI_312/docs']};
}
const api=Object.freeze({inspect});root.ITEVaultCompatibility=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
