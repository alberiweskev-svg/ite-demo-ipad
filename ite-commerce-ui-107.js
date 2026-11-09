/* I.T.E. 4.0.107 — unified commerce console, TEST-only local archive. */
(function(){"use strict";
const api=window.ITEWorkflow100,commerce=window.ITECommerce107,KEY="ITE-WORKFLOW-TEST-101";
if(!api||!commerce||!document.body)return;
const host=document.createElement("section");host.id="ite-commerce-107";host.className="panel";
host.innerHTML='<h2>Preventivi, Extra e fatture — 4.0.107 TEST</h2><p class="hint">Dati sintetici locali. Nessuna emissione, registrazione fiscale o invio a clienti.</p><div class="grid"><label>Cliente<select id="c107-client"></select></label><label>Operatore<input id="c107-actor" value="Tecnico TEST"></label><label>Categoria<select id="c107-category"><option>FORNITURA</option><option>POSA</option><option>SMONTAGGIO</option><option>SMALTIMENTO</option><option>ALTRO</option></select></label><label>Quantità<input id="c107-quantity" type="number" min="1" value="1"></label><label>Prezzo unitario €<input id="c107-price" type="number" min="0" step=".01" value="0"></label><label>Preventivo collegato<select id="c107-quote"></select></label><label>Voce Extra<select id="c107-extra"></select></label><label>Quantità approvata<input id="c107-approved" type="number" min="1" value="1"></label><label>Motivazione<input id="c107-reason" value="Approvazione TEST"></label></div><div class="actions"><button id="c107-newquote">Nuova voce preventivo</button><button id="c107-accept">Accetta preventivo</button><button id="c107-newextra">Nuova voce Extra</button><button id="c107-approve">Approva Extra parziale</button><button id="c107-approveall">Approva Extra totale</button><button id="c107-draft">Prepara proforma TEST</button></div><p id="c107-status" role="status" aria-live="polite"></p><div id="c107-summary"></div><div id="c107-list"></div>';
(document.querySelector(".wrap")||document.body).appendChild(host);
const $=x=>host.querySelector("#c107-"+x),esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const load=()=>api.importJSON(localStorage.getItem(KEY)||api.exportJSON(api.fresh())),save=s=>localStorage.setItem(KEY,api.exportJSON(s));
const uid=()=> "TEST-COM-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
function opts(node,rows,selected){node.innerHTML='<option value="">Seleziona...</option>'+rows.map(r=>'<option value="'+esc(r.id)+'"'+(r.id===selected?' selected':'')+'>'+esc(r.name||r.id)+"</option>").join("");}
function render(){const s=load(),r=s.records,client=$("client").value;opts($("client"),r.clients,client);const id=$("client").value;opts($("quote"),r.quotes.filter(x=>x.clientId===id),$("quote").value);opts($("extra"),r.extras.filter(x=>x.clientId===id),$("extra").value);
if(!id){$("summary").textContent="Creare prima un cliente TEST in Anagrafiche.";return;}
const totals=commerce.summary(s,id),eur=n=>(n/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
$("summary").textContent="Preventivi: "+eur(totals.quotedCents)+" | Accettati: "+eur(totals.acceptedCents)+" | Extra approvati: "+eur(totals.approvedExtraCents)+" | Vendite TEST: "+eur(totals.salesCents)+" | TD04 TEST: "+eur(totals.creditCents);
$("list").innerHTML=[...r.quotes.filter(x=>x.clientId===id).map(x=>["Preventivo",x]),...r.extras.filter(x=>x.clientId===id).map(x=>["Extra",x]),...r.invoices.filter(x=>x.clientId===id).map(x=>["Documento",x])].map(([kind,x])=>'<div class="item"><strong>'+esc(kind)+" "+esc(x.id)+'</strong><small>'+esc(x.category||x.type)+" · "+esc(x.status||"")+"</small></div>").join("");
}
function run(fn){try{const s=load(),next=fn(s);save(next);render();$("status").textContent="Salvato nell’archivio TEST — revisione "+next.revision;}catch(e){$("status").textContent="Non salvato: "+e.message;}}
const actor=()=>$("actor").value.trim(),client=()=>$("client").value,quote=()=>$("quote").value,extra=()=>$("extra").value;
const number=id=>{const n=Number($(id).value);if(!Number.isSafeInteger(n)||n<1)throw Error("Quantità non valida");return n;};
$("client").onchange=render;
$("newquote").onclick=()=>run(s=>commerce.line(s,"quotes",{id:uid(),clientId:client(),category:$("category").value,quantity:number("quantity"),unitCents:Math.round(Number($("price").value)*100)},actor(),s.revision));
$("accept").onclick=()=>run(s=>commerce.transition(s,"quotes",quote(),"ACCETTATO",actor(),$("reason").value,s.revision));
$("newextra").onclick=()=>run(s=>commerce.line(s,"extras",{id:uid(),clientId:client(),quoteId:quote(),category:$("category").value,quantity:number("quantity"),unitCents:Math.round(Number($("price").value)*100)},actor(),s.revision));
$("approve").onclick=()=>run(s=>commerce.transition(s,"extras",extra(),"PARZIALE",actor(),$("reason").value,s.revision,number("approved")));
$("approveall").onclick=()=>run(s=>commerce.transition(s,"extras",extra(),"APPROVATO",actor(),$("reason").value,s.revision));
$("draft").onclick=()=>run(s=>{const quotes=s.records.quotes.filter(x=>x.clientId===client()&&x.status==="ACCETTATO").map(x=>x.id),extras=s.records.extras.filter(x=>x.clientId===client()&&["APPROVATO","PARZIALE"].includes(x.status)&&quotes.includes(x.quoteId)).map(x=>x.id);return commerce.draftInvoice(s,client(),uid(),actor(),s.revision,{quoteIds:quotes,extraIds:extras,type:"PROFORMA"});});
render();
})();