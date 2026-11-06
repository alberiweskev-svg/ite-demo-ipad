/* I.T.E. 4.0.40 — collegamento controllato gerarchia TEST ↔ anagrafiche contabili TEST. */
(function(root){'use strict';
const H=root.ITE40HierarchyTest||(typeof module!=='undefined'?require('./ite-hierarchy-test-40.js'):null);
const F=root.ITE40FinanceReview||(typeof module!=='undefined'?require('./ite-finance-review-40.js'):null);
function plan(hierarchy,subjects){
 const h=H.check(hierarchy),f=F.validateSubjects(subjects),existing=new Map(f.map(s=>[s.id,s]));
 const add=[],conflicts=[],matched=[];
 for(const c of h.clienti){
  const s=existing.get(c.id);
  if(!s)add.push({id:c.id,role:'CLIENTE',name:c.nome});
  else if(s.role!=='CLIENTE'||s.name!==c.nome)conflicts.push({id:c.id,reason:s.role!=='CLIENTE'?'RUOLO_DIVERSO':'NOME_DIVERSO',hierarchyName:c.nome,financeName:s.name});
  else matched.push(c.id);
 }
 return {add,conflicts,matched,counts:Object.fromEntries(H.TYPES.map(t=>[t,h[t].length]))};
}
function synchronize(storage){
 const h=H.create(storage),f=F.create(storage);h.load();f.load();
 const p=plan(h.get(),f.get());if(p.conflicts.length)throw Error('CONFLITTI_DA_RISOLVERE');
 const before=f.get(),after=F.validateSubjects(before.concat(p.add));
 if(p.add.length)f.save(after);
 return {added:p.add.length,unchanged:p.matched.length,subjects:after.length};
}
function inspect(storage){
 const h=H.create(storage),f=F.create(storage);h.load();f.load();
 const p=plan(h.get(),f.get());
 return {...p,subjects:f.get().length};
}
const api=Object.freeze({plan,synchronize,inspect});root.ITE40HierarchyFinanceBridge=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
