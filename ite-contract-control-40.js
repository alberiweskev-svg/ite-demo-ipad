/* I.T.E. 4.0.60: controllo integrato contratti TEST, sola lettura. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./ite-quotes-40.js'):root.ITEQuotes40,typeof module==='object'&&module.exports?require('./ite-invoice-ledger-40.js'):root.ITEInvoiceLedger40,typeof module==='object'&&module.exports?require('./ite-contract-settlement-40.js'):root.ITEContractSettlement40);if(typeof module==='object'&&module.exports)module.exports=api;root.ITEContractControl40=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Q,I,S){'use strict';
if(!Q||!I||!S)throw Error('Motori TEST mancanti');
const cents=n=>Math.round((n+Number.EPSILON)*100),euro=n=>Math.round(n)/100;
function overview(q,i,s){Q.validate(q);I.validate(i);S.validate(s,q,i);
const linked=new Set(s.links.map(l=>l.invoiceId));
const contracts=q.quotes.filter(x=>x.status==='ACCEPTED').map(x=>{
const r=S.report(s,q,i,x.id),issues=[];
if(r.overbilled)issues.push('SUPERAMENTO_CONTRATTO');
if(r.remainingToInvoice<0)issues.push('RESIDUO_NEGATIVO');
if(x.extras.some(e=>e.approval==='PENDING'))issues.push('EXTRA_DA_APPROVARE');
if(r.rows.some(row=>row.kind==='BALANCE')&&r.remainingToInvoice>0.01)issues.push('SALDO_CON_RESIDUO');
if(r.rows.filter(row=>row.kind==='BALANCE').length>1)issues.push('SALDI_MULTIPLI');
return {id:x.id,customer:x.customer,contractTotal:r.contractTotal,billed:r.billed,paid:r.paid,unpaid:r.unpaid,remainingToInvoice:r.remainingToInvoice,linkedInvoices:r.rows.length,issues};
});
const unlinkedSales=i.documents.filter(d=>d.type==='SALE'&&!linked.has(d.id)).map(d=>({id:d.id,number:d.number,party:d.party,total:d.total}));
const total=key=>euro(contracts.reduce((sum,c)=>sum+cents(c[key]),0));
return {schema:'ITE-CONTRACT-CONTROL-TEST-1',contracts,unlinkedSales,totals:{contractTotal:total('contractTotal'),billed:total('billed'),paid:total('paid'),unpaid:total('unpaid'),remainingToInvoice:total('remainingToInvoice')},warnings:contracts.reduce((n,c)=>n+c.issues.length,0),notice:'Riepilogo TEST non fiscale: verificare IVA, acconti e beni significativi.'};
}
function csv(report){if(!report||report.schema!=='ITE-CONTRACT-CONTROL-TEST-1'||!Array.isArray(report.contracts))throw Error('Riepilogo non valido');
const cell=v=>'"'+String(v).replace(/^[=+@\-\t\r]/,"'"+'$&').replace(/"/g,'""')+'"';
const rows=[['ID','Cliente TEST','Contratto EUR','Fatturato EUR','Incassato EUR','Da incassare EUR','Da fatturare EUR','Segnalazioni'],...report.contracts.map(c=>[c.id,c.customer,c.contractTotal,c.billed,c.paid,c.unpaid,c.remainingToInvoice,c.issues.join('; ')])];
return '\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';
}
return {overview,csv};
});