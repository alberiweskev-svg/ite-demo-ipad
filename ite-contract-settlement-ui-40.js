/* I.T.E. 4.0.59 — Local TEST contract settlement panel. */
(function(root){"use strict";
if(typeof document==="undefined"||!root.ITEContractSettlement40||!root.ITEQuotes40||!root.ITEInvoiceLedger40)return;
const S=root.ITEContractSettlement40,Q=root.ITEQuotes40,I=root.ITEInvoiceLedger40;
const SK="ITE-4-CONTRACT-SETTLEMENT-TEST-1",QK="ITE-4-QUOTES-TEST-1",IK="ITE-4-INVOICES-TEST-1";
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n;};
const panel=el("section");panel.className="panel";panel.id="ite-contract-settlement-test";
panel.append(el("h2","Acconti, saldo e residui contrattuali — TEST 4.0.59"),el("p","Collega bozze fattura vendita già presenti a preventivi accettati. Gli incassi si registrano nel pannello fatture. Nessuna emissione fiscale."));
const form=el("div");form.className="grid";
const field=(title,tag)=>{const l=el("label",title),n=el(tag);l.append(n);form.append(l);return n;};
const quote=field("Preventivo accettato","select"),invoice=field("Bozza fattura vendita","select"),kind=field("Tipo documento","select");
[["ADVANCE","Acconto"],["BALANCE","Saldo"]].forEach(([v,t])=>{const o=el("option",t);o.value=v;kind.append(o);});
const actions=el("div");actions.className="actions";const add=el("button","Collega documento TEST"),reload=el("button","Aggiorna riepilogo");add.type=reload.type="button";actions.append(add,reload);
const status=el("p");status.setAttribute("role","status");const output=el("div");
panel.append(form,actions,status,output);
const read=(key,api)=>{const raw=localStorage.getItem(key);return raw?api.importJson(raw):api.empty();};
const archives=()=>{const q=read(QK,Q),i=read(IK,I),s=localStorage.getItem(SK)?S.importJson(localStorage.getItem(SK),q,i):S.empty();return {q,i,s};};
const money=n=>"€ "+n.toFixed(2);
function render(){try{const {q,i,s}=archives();const oldQ=quote.value,oldI=invoice.value;quote.replaceChildren();invoice.replaceChildren();
q.quotes.filter(x=>x.status==="ACCEPTED").forEach(x=>{const o=el("option",x.id+" · "+x.customer);o.value=x.id;quote.append(o);});
i.documents.filter(x=>x.type==="SALE"&&!s.links.some(l=>l.invoiceId===x.id)).forEach(x=>{const o=el("option",x.number+" · "+x.party+" · "+money(x.total));o.value=x.id;invoice.append(o);});
if([...quote.options].some(x=>x.value===oldQ))quote.value=oldQ;
if([...invoice.options].some(x=>x.value===oldI))invoice.value=oldI;
output.replaceChildren();if(!quote.value){status.textContent="Nessun preventivo accettato TEST.";return;}
const r=S.report(s,q,i,quote.value);
output.append(el("h3","Riepilogo "+quote.value),el("p","Contratto "+money(r.contractTotal)+" · Fatturato "+money(r.billed)+" · Incassato "+money(r.paid)+" · Da incassare "+money(r.unpaid)+" · Da fatturare "+money(r.remainingToInvoice)));
r.rows.forEach(x=>output.append(el("p",x.kind+" · "+x.number+" · Totale "+money(x.total)+" · Incassato "+money(x.paid)+" · Residuo "+money(x.unpaid))));
output.append(el("p",r.warning));status.textContent="Dati TEST locali aggiornati.";
}catch(e){status.textContent="Verifica necessaria: "+e.message;}}
add.addEventListener("click",()=>{try{if(!quote.value||!invoice.value)throw Error("Selezionare preventivo e fattura");const before=localStorage.getItem(SK);const {q,i,s}=archives();const result=S.link(s,q,i,quote.value,invoice.value,kind.value);
if(!root.confirm("Collegare questa bozza fattura TEST al contratto?"))return;
const current=localStorage.getItem(SK);if(current!==before)throw Error("Archivio cambiato: aggiornare");
localStorage.setItem(SK,S.exportJson(result.archive,q,i));render();status.textContent="Documento collegato. Nessun pagamento registrato automaticamente.";
}catch(e){status.textContent=e.message;}});
reload.addEventListener("click",render);quote.addEventListener("change",render);
document.addEventListener("ite:invoice-ledger-updated",render);document.addEventListener("ite:quotes-updated",render);
root.addEventListener("storage",e=>{if([SK,QK,IK].includes(e.key))render();});
(document.querySelector("#ite-quote-invoice-test")||document.querySelector("#ite-quotes-test")||document.body).insertAdjacentElement("afterend",panel);render();
})(typeof globalThis!=="undefined"?globalThis:this);
