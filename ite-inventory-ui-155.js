/* I.T.E. 4.0.155 — Magazzino integrato, esclusivamente dati TEST. */
(function(root){"use strict";let attempts=0;
function mount(){
 const S=root.ITE_UnifiedSession129,I=root.ITE_Inventory154;
 if(!S||!I){if(++attempts<80)setTimeout(mount,100);return;}
 if(document.getElementById("ite-inventory-155"))return;
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n;};
 const panel=el("section");panel.id="ite-inventory-155";panel.className="panel";
 panel.append(el("h2","Magazzino e prenotazioni materiali — TEST 4.0.155"),el("p","Articoli, carichi, scarichi, prenotazioni per preventivi accettati e uscita cantiere. Dati esclusivamente fittizi nella sessione TEST condivisa; nessuna movimentazione reale."));
 const form=el("div");form.className="grid";const fields={};
 function field(name,title,type="text"){const l=el("label",title),i=el("input");i.type=type;i.placeholder=title;if(type==="number"){i.min="0";i.step="0.001";}fields[name]=i;l.append(i);form.append(l);return i;}
 field("id","ID articolo");field("code","Codice articolo");field("description","Descrizione");field("category","Categoria");field("unit","Unità");field("unitPrice","Prezzo unitario €","number");field("vatRate","IVA %","number");fields.vatRate.value="22";fields.unit.value="pz";
 const actor=field("actor","Operatore");actor.value="Operatore TEST";
 const add=el("button","Salva articolo TEST");add.type="button";const status=el("p");status.setAttribute("role","status");
 panel.append(el("h3","Archivio articoli"),form,add,status);
 const actions=el("div");actions.className="grid";
 function select(title){const l=el("label",title),s=el("select");l.append(s);actions.append(l);return s;}
 const article=select("Articolo"),estimate=select("Preventivo accettato");
 const qtyLabel=el("label","Quantità"),quantity=el("input");quantity.type="number";quantity.min="0.001";quantity.step="0.001";qtyLabel.append(quantity);actions.append(qtyLabel);
 const refLabel=el("label","Riferimento / ID operazione"),ref=el("input");ref.placeholder="TEST-001";refLabel.append(ref);actions.append(refLabel);
 const buttons=el("div");buttons.className="actions";
 const operations=[["Carico","IN"],["Scarico disponibile","OUT"],["Prenota per preventivo","RESERVE"]];
 for(const [title,action] of operations){const b=el("button",title);b.type="button";b.onclick=()=>run(action);buttons.append(b);}
 panel.append(el("h3","Movimenti e prenotazioni"),actions,buttons);
 const list=el("div"),reservations=el("div");panel.append(el("h3","Giacenze e disponibilità"),list,el("h3","Prenotazioni"),reservations);
 const option=(s,value,title)=>{const o=el("option",title);o.value=value;s.append(o);};
 function apply(next){S.restore(next,actor.value.trim());status.textContent="Operazione TEST registrata — revisione "+next.revision;}
 function run(action){try{const s=S.get(),n=Number(quantity.value),id=ref.value.trim(),a=actor.value.trim();let next;
 if(action==="RESERVE")next=I.reserve(s,{id,estimateId:estimate.value,itemId:article.value,quantity:n},a,s.revision);
 else next=I.movement(s,{id,itemId:article.value,direction:action,quantity:n,reference:"TEST"},a,s.revision);
 apply(next);
 }catch(e){status.textContent="Operazione respinta: "+e.message;}}
 add.onclick=()=>{try{const s=S.get(),d={id:fields.id.value,code:fields.code.value,description:fields.description.value,category:fields.category.value,unit:fields.unit.value,unitPrice:Number(fields.unitPrice.value),vatRate:Number(fields.vatRate.value)};apply(I.item(s,d,actor.value.trim(),s.revision));}catch(e){status.textContent="Articolo respinto: "+e.message;}};
 function refresh(){try{const s=S.get(),inv=I.overview(s),oldA=article.value,oldE=estimate.value;
 article.replaceChildren();estimate.replaceChildren();list.replaceChildren();reservations.replaceChildren();
 for(const i of inv.items){option(article,i.id,i.code+" — "+i.description);const p=el("p",i.code+" · "+i.description+" · giacenza "+i.onHand+" · prenotati "+i.reserved+" · disponibili "+i.available+" "+i.unit);list.append(p);}
 for(const e of s.commercial?.estimates||[])if(e.status==="ACCETTATO")option(estimate,e.id,e.id);
 if([...article.options].some(o=>o.value===oldA))article.value=oldA;
 if([...estimate.options].some(o=>o.value===oldE))estimate.value=oldE;
 for(const r of s.inventory?.reservations||[]){const line=el("div");line.className="item";line.append(el("strong",r.id+" · "+r.itemId+" · "+r.quantity+" · "+r.status),el("p","Preventivo "+r.estimateId));
 if(r.status==="ATTIVA")for(const [title,action] of [["Scarica al cantiere","dispatch"],["Annulla prenotazione","cancel"]]){const b=el("button",title);b.type="button";b.onclick=()=>{try{const current=S.get(),a=actor.value.trim(),next=action==="dispatch"?I.dispatch(current,r.id,ref.value.trim(),a,current.revision):I.cancel(current,r.id,a,current.revision);apply(next);}catch(e){status.textContent="Operazione respinta: "+e.message;}};line.append(b);}
 reservations.append(line);}
 if(!inv.items.length)list.append(el("p","Nessun articolo TEST."));
 if(!s.inventory?.reservations?.length)reservations.append(el("p","Nessuna prenotazione."));
 for(const err of inv.errors)list.append(el("p","Anomalia: "+err.code+" "+err.id));
 }catch(e){status.textContent="Errore magazzino: "+e.message;}}
 S.subscribe(refresh);
 (document.getElementById("ite-reconciliation-153")||document.getElementById("ite-commercial-150")||document.querySelector("main")||document.body).append(panel);refresh();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})(window);
