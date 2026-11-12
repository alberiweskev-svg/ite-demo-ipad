/* I.T.E. 4.0.185 — trasferimento esplicito e controllato, solo dati fittizi. */
(function(root){"use strict";
function init(){
 const d=root.document,B=root.ITE_QuoteFiscalBridge185,F=root.ITE_FieldWorkspaceBridge174,E=root.ITE_ExtrasWorkspaceBridge175,R=root.ITE_FiscalWorkspaceBridge185;
 if(!d||!B||!F||!E||!R)return;
 const host=d.getElementById("ite-fiscal-workspace-184");if(!host)return;
 const panel=d.createElement("div");panel.className="panel";const title=d.createElement("h4");title.textContent="Preventivi accettati → proforma TEST";
 const note=d.createElement("p");note.className="hint";note.textContent="Genera soltanto bozze dimostrative. IVA preimpostata al 10% da verificare per ogni caso; non è una fattura elettronica.";
 const select=d.createElement("select");select.setAttribute("aria-label","Preventivo accettato");
 const btn=d.createElement("button");btn.type="button";btn.textContent="Crea bozza proforma TEST";
 const msg=d.createElement("p");msg.setAttribute("role","status");panel.append(title,note,select,btn,msg);host.append(panel);
 function refresh(){const current=select.value;select.replaceChildren();const qs=E.snapshot().quotes.filter(x=>x.status==="ACCETTATO");for(const q of qs){const opt=d.createElement("option");opt.value=q.id;opt.textContent=q.id+" — "+(q.totalCents/100).toFixed(2)+" €";select.append(opt)}if(qs.some(q=>q.id===current))select.value=current;btn.disabled=!qs.length;}
 btn.addEventListener("click",()=>{try{const prepared=B.prepare(F.snapshot(),E.snapshot(),select.value);const already=R.snapshot().documents.some(x=>x.sourceQuoteId===prepared.quoteId);if(already)throw Error("PREVENTIVO_GIA_COLLEGATO");if(!root.confirm("Creare una bozza PROFORMA TEST da "+prepared.quoteId+"? Nessuna emissione fiscale."))return;R.addPrepared(prepared);msg.textContent="Bozza TEST creata: "+prepared.document.number+". Controllare IVA e righe prima di qualsiasi uso.";refresh()}catch(e){msg.textContent="Operazione respinta: "+e.message}});
 E.subscribe(refresh);F.subscribe(refresh);refresh();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
