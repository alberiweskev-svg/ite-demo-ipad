/* I.T.E. 4.0.172 — integrated field workspace; volatile synthetic TEST session only. */
(function(root){"use strict";
function init(){
 const F=root.ITE_FieldOperations171;if(!F||!root.document)return;
 const d=root.document,host=d.createElement("section");host.id="ite-field-workspace-172";host.className="panel";
 const h=d.createElement("h2");h.textContent="I.T.E. 4.0.172 — Anagrafiche, agenda e interventi TEST";host.append(h);
 const note=d.createElement("p");note.className="hint";note.textContent="Solo dati fittizi. Sessione temporanea: nessun salvataggio permanente e nessuna sincronizzazione. Non inserire dati clienti reali.";host.append(note);
 const status=d.createElement("p");status.setAttribute("role","status");host.append(status);
 const bar=d.createElement("div");bar.className="actions";host.append(bar);
 const area=d.createElement("div");host.append(area);
 let s=F.empty(),serial=0;
 const kinds=[["clients","Cliente",["name"]],["sites","Sede",["name","clientId"]],["systems","Impianto",["name","siteId"]],["equipment","Apparecchiatura",["name","systemId"]],["operators","Operatore",["name"]],["appointments","Appuntamento",["clientId","siteId","equipmentId","operatorId","start","end"]]];
 const fields={name:"Nome",clientId:"Cliente",siteId:"Sede",systemId:"Impianto",equipmentId:"Apparecchiatura",operatorId:"Tecnico",start:"Inizio",end:"Fine"};
 const link={clientId:"clients",siteId:"sites",systemId:"systems",equipmentId:"equipment",operatorId:"operators"};
 function el(tag,label){const x=d.createElement(tag);if(label!==undefined)x.textContent=label;return x}
 function button(label,fn,container=bar){const b=el("button",label);b.type="button";b.addEventListener("click",fn);container.append(b);return b}
 function feedback(t,ok){status.textContent=t;status.style.color=ok?"#176438":"#a03132"}
 function action(fn){try{s=fn(s).state;feedback("Operazione TEST registrata. Revisione "+s.revision,true);render()}catch(e){feedback("Operazione respinta: "+e.message,false)}}
 function inputForm(title,definitions,submit){
 area.replaceChildren();area.append(el("h3",title));const form=el("form");form.className="grid";area.append(form);const inputs={};
 definitions.forEach(([key,label,choices])=>{const wrap=el("label",label);let control;
 if(choices){control=el("select");const blank=el("option","Seleziona");blank.value="";control.append(blank);choices.forEach(v=>{const opt=el("option",v.name+" ("+v.id+")");opt.value=v.id;control.append(opt)})}
 else{control=el("input");control.type=key==="start"||key==="end"?"datetime-local":"text";control.maxLength=200}
 control.required=true;wrap.append(control);form.append(wrap);inputs[key]=control});
 const submitButton=el("button","Registra TEST");submitButton.type="submit";form.append(submitButton);
 form.addEventListener("submit",e=>{e.preventDefault();const v={};Object.keys(inputs).forEach(k=>v[k]=inputs[k].value);submit(v)});
 }
 function showCreate(kind){const spec=kinds.find(x=>x[0]===kind);if(!spec)return;
 const definitions=spec[2].map(k=>[k,fields[k],link[k]?s[link[k]]:null]);
 inputForm("Nuovo "+spec[1],definitions,v=>{const id=kind.slice(0,3).toUpperCase()+"-"+(++serial);if(v.start)v.start=new Date(v.start).toISOString();if(v.end)v.end=new Date(v.end).toISOString();action(state=>F.add(state,state.revision,"OPERATORE_TEST",kind,{id,...v}))});
 }
 function showList(){area.replaceChildren();const heading=el("h3","Situazione operativa");area.append(heading);
 kinds.forEach(([kind,label])=>{const block=el("div");block.className="item";block.append(el("strong",label+" ("+s[kind].length+")"));
 s[kind].forEach(v=>{const line=el("p",v.name||[v.id,v.start,v.status].filter(Boolean).join(" · "));block.append(line)});
 area.append(block)});
 const b=el("div");b.className="item";b.append(el("strong","Interventi ("+s.interventions.length+")"));
 s.interventions.forEach(i=>{const line=el("div");line.className="item";line.append(el("p",i.id+" · "+i.status+" · "+i.operatorId+" · "+(i.durationMinutes??"—")+" minuti"));
 if(i.status==="APERTO"||i.status==="RIAPERTO")button("Chiudi",()=>showClose(i),line);
 if(i.status==="CHIUSO")button("Revisiona",()=>showReopen(i),line);b.append(line)});
 area.append(b);
 }
 function showAgenda(){area.replaceChildren();area.append(el("h3","Agenda appuntamenti"));
 s.appointments.slice().sort((a,b)=>a.start.localeCompare(b.start)).forEach(a=>{
 const item=el("div");item.className="item";item.append(el("strong",a.id+" · "+a.status));
 item.append(el("p",a.start+" → "+a.end+" · "+a.operatorId+" · "+a.equipmentId));
 if(a.status==="PROGRAMMATO")button("Sono arrivato",()=>action(state=>F.arrive(state,state.revision,a.operatorId,a.id,new Date().toISOString())),item);
 area.append(item)});
 }
 function showClose(i){inputForm("Chiusura "+i.id,[["at","Ora uscita"],["extra","Lavori aggiuntivi (descrizione)"]],v=>action(state=>F.close(state,state.revision,i.operatorId,i.id,new Date(v.at).toISOString(),v.extra.trim()?[v.extra]:[])));
 const at=area.querySelector("input");if(at){at.type="datetime-local";at.value=new Date().toISOString().slice(0,16)}
 const extra=area.querySelectorAll("input")[1];if(extra)extra.required=false;
 }
 function showReopen(i){inputForm("Revisione "+i.id,[["reason","Motivo della revisione"]],v=>action(state=>F.reopen(state,state.revision,"OPERATORE_TEST",i.id,v.reason)))}
 function render(){bar.replaceChildren();button("Riepilogo",showList);button("Agenda",showAgenda);kinds.forEach(([kind,label])=>button("+ "+label,()=>showCreate(kind)));showList()}
 const anchor=d.querySelector("#app-main")||d.querySelector("main")||d.querySelector(".wrap")||d.body;anchor.append(host);
 render();
}
if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
})(typeof globalThis!=="undefined"?globalThis:this);
