/* Synthetic-only workflow demonstration integrated in Quadro operativo. */
(function(){'use strict';
function start(){
 const host=document.getElementById('quadro-operativo');const engine=window.ITEQuoteLifecycle,link=window.ITECommercialLinkage;
 if(!host||!engine||!link)return;
 const panel=document.createElement('div');panel.className='panel';panel.id='ite-quote-lifecycle-demo';
 panel.innerHTML='<h3>Preventivi ed Extra — prova integrata 4.0</h3><p class="hint">Solo dati fittizi. Nessun salvataggio, fatturazione o modifica agli archivi clienti.</p><div class="actions"><button type="button" data-act="reset">Nuovo preventivo dimostrativo</button><button type="button" data-act="send">Invia Extra (simulazione)</button><button type="button" data-act="accept">Accetta Extra (simulazione)</button><button type="button" data-act="quote">Accetta preventivo (simulazione)</button></div><p role="status" aria-live="polite" data-result></p>';
 host.appendChild(panel);
 const data={catalog:{clients:[{id:'demo-client'}],sites:[{id:'demo-site',clientId:'demo-client'}],systems:[{id:'demo-system',siteId:'demo-site'}],equipment:[]},appointments:[{id:'demo-appointment',clientId:'demo-client',siteId:'demo-site',systemId:'demo-system'}]};
 const ref={clientId:'demo-client',siteId:'demo-site',systemId:'demo-system',appointmentId:'demo-appointment'};
 let quote;const out=panel.querySelector('[data-result]');const at=()=>new Date().toISOString();
 function show(){const p=engine.preview(data,quote);out.textContent='Preventivo '+quote.id+' — '+quote.status+' | Extra: '+quote.extras.map(e=>e.id+' '+e.status).join(', ')+' | Imponibile € '+p.taxable.toFixed(2)+' | IVA € '+p.vat.toFixed(2)+' | Totale € '+p.total.toFixed(2);}
 function reset(){quote=engine.createQuote(data,ref,link.separateSupplyInstall('lavabo 60 cm',120,80),{id:'DEMO-001',createdAt:at()});quote=engine.addExtra(quote,{id:'EXTRA-001',lines:[{type:'POSA',description:'Posa sifone',quantity:1,unitPrice:20,vatRate:10}]});show();}
 panel.addEventListener('click',e=>{const action=e.target.closest('button[data-act]')?.dataset.act;if(!action)return;try{
 if(action==='reset')reset();
 else if(action==='send')quote=engine.transition(quote,'EXTRA','EXTRA-001','INVIATO','Operatore demo',at());
 else if(action==='accept')quote=engine.transition(quote,'EXTRA','EXTRA-001','ACCETTATO','Cliente demo',at());
 else if(action==='quote'){if(quote.status==='BOZZA')quote=engine.transition(quote,'QUOTE',null,'INVIATO','Operatore demo',at());quote=engine.transition(quote,'QUOTE',null,'ACCETTATO','Cliente demo',at());}
 show();
 }catch(err){out.textContent='Operazione non eseguita: '+err.message;}});
 reset();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
