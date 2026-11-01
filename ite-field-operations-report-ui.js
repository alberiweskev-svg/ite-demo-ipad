/* I.T.E. 4.0 — synthetic field-report demonstration, no vault writes. */
(function(root){'use strict';
if(!root.document)return;
function start(){
 const show=document.getElementById('field-report-demo'),print=document.getElementById('field-report-print'),status=document.getElementById('field-report-status'),target=document.getElementById('field-report-result');
 if(!show||!print||!status||!target)return;
 const catalog={clients:[{id:'DEMO-C',name:'Cliente dimostrativo'}],sites:[{id:'DEMO-S',clientId:'DEMO-C',address:'Via Esempio 1'}],systems:[{id:'DEMO-I',siteId:'DEMO-S'}],equipment:[{id:'DEMO-E',systemId:'DEMO-I',name:'Caldaia demo'}],operators:[{id:'DEMO-O',name:'Tecnico demo',active:true}]};
 const item={id:'DEMO-A',clientId:'DEMO-C',siteId:'DEMO-S',systemId:'DEMO-I',equipmentId:'DEMO-E',operatorId:'DEMO-O',kind:'Manutenzione',startsAt:'2026-11-02T09:00:00+01:00',endsAt:'2026-11-02T10:00:00+01:00'};
 let html='';
 show.addEventListener('click',()=>{
  try{
   const a=root.ITEFieldPlanning.schedule(catalog,[],item),result=root.ITEFieldOperationsReport.report(catalog,a);
   html=result.html;target.innerHTML=html;status.textContent=result.printReady?'Esempio sintetico valido: 1 appuntamento, nessun conflitto.':'Anomalie rilevate: '+result.issues.length;
  }catch(e){status.textContent='Errore del modulo: '+String(e.message);html='';}
 });
 print.addEventListener('click',()=>{
  if(!html){status.textContent='Generare prima il report dimostrativo.';return}
  const popup=root.open('','_blank');if(!popup){status.textContent='Finestra di stampa bloccata dal browser.';return}
  popup.document.write('<!doctype html><html lang="it"><meta charset="utf-8"><title>Agenda demo I.T.E.</title><style>body{font:14px sans-serif;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #aaa;padding:6px;text-align:left}@media print{body{margin:8mm}}</style>'+html+'</html>');popup.document.close();popup.focus();popup.print();
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
