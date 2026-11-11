/* I.T.E. 4.0.151 — integrated TEST document register. No uploads or fiscal issuance. */
(function(root){"use strict";let attempts=0;
function mount(){
 const S=root.ITE_UnifiedSession129,I=root.ITE_Invoices151;
 if(!S||!I){if(++attempts<80)setTimeout(mount,100);return;}
 if(document.getElementById("ite-invoices-151"))return;
 const make=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n;};
 const panel=make("section");panel.id="ite-invoices-151";panel.className="panel";
 panel.append(make("h2","Registro fatture, proforma e TD04 — TEST 4.0.151"),make("p","Inserimento manuale con dati fittizi. Nessun PDF viene caricato, nessuna fattura viene emessa."));
 const grid=make("div");grid.className="grid",fields={};
 const specs=[["id","ID TEST","text"],["number","Numero documento","text"],["documentDate","Data documento","date"],["issuerVat","P.IVA emittente","text"],["companyVat","P.IVA I.T.E. per classificazione","text"],["net","Imponibile €","number"],["vat","IVA €","number"],["gross","Totale €","number"]];
 for(const [key,title,type] of specs){const label=make("label",title),input=make("input");input.type=type;input.placeholder=title;if(type==="number"){input.min="0";input.step="0.01";}fields[key]=input;label.append(input);grid.append(label);}
 fields.companyVat.value="03857941201";fields.documentDate.value="2026-11-11";
 const type=make("select");for(const [value,label] of [["FATTURA","Fattura"],["PROFORMA","Proforma"],["TD04","Nota di credito TD04"]]){const o=make("option",label);o.value=value;type.append(o);}const l=make("label","Tipologia");l.append(type);grid.append(l);
 const save=make("button","Registra documento TEST"),output=make("div"),status=make("p");save.type="button";status.setAttribute("role","status");
 panel.append(grid,save,status,make("h3","Documenti registrati"),output);
 function render(){output.replaceChildren();const st=S.get();const docs=st.commercial?.invoices||[];for(const d of docs){const item=make("div");item.className="item";item.append(make("strong",d.number+" · "+d.kind+" · "+d.direction),make("p","Data "+d.documentDate+" · Imponibile € "+d.net.toFixed(2)+" · IVA € "+d.vat.toFixed(2)+" · Totale € "+d.gross.toFixed(2)));if(d.kind==="NOTA_CREDITO"){item.append(make("p","Recupero: "+d.recoveryStatus+" · € "+(d.recoveredAmount||0).toFixed(2)));const amount=make("input");amount.type="number";amount.min="0.01";amount.step="0.01";amount.placeholder="Importo recuperato €";const b=make("button","Registra recupero TEST");b.type="button";b.onclick=()=>{try{const s=S.get();S.restore(I.registerRecovery(s,d.id,Number(amount.value),"Operatore TEST",s.revision),"Operatore TEST");status.textContent="Recupero registrato.";}catch(e){status.textContent=e.message;}};item.append(amount,b);}output.append(item);}if(!docs.length)output.append(make("p","Nessun documento registrato."));}
 save.onclick=()=>{try{const st=S.get(),doc={id:fields.id.value,number:fields.number.value,documentDate:fields.documentDate.value,issuerVat:fields.issuerVat.value,documentType:type.value,isProforma:type.value==="PROFORMA",net:Number(fields.net.value),vat:Number(fields.vat.value),gross:Number(fields.gross.value)};const next=I.saveDocument(st,doc,"Operatore TEST",st.revision,fields.companyVat.value);S.restore(next,"Operatore TEST");status.textContent="Documento TEST registrato.";}catch(e){status.textContent=e.message;}};
 S.subscribe(render);(document.querySelector("#ite-commercial-150")||document.querySelector("main")||document.body).append(panel);render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
