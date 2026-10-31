/* I.T.E. 4.0 — isolated read-only preview: ordinary and multi-sheet Excel. */
(function(){'use strict';
const $=id=>document.getElementById(id),allowed=new Set(['csv','tsv','xlsx']);
const report=x=>{$('report').textContent=x};
function show(rows){
 const body=$('rows');body.replaceChildren();
 for(const row of rows){
  const tr=document.createElement('tr');
  for(const value of [row.documentId,row.article?.manufacturerCode,row.article?.description,row.quantity??'—',row.action]){
   const td=document.createElement('td');td.textContent=String(value??'');tr.append(td);
  }
  body.append(tr);
 }
}
$('preview').addEventListener('click',async()=>{
 $('rows').replaceChildren();
 try{
  const mode=$('mode').value,kind=$('kind').value,files=Array.from($('files').files);
  const historical=$('legacy').checked,documentId=$('docid').value.trim();
  if(!files.length||files.length>100)throw Error('Seleziona da 1 a 100 file CSV/TSV/XLSX');
  if(!documentId)throw Error('Identificativo documento obbligatorio');
  if(historical&&mode!=='catalogue')throw Error('Archivio storico importabile solo in Archivio materiali');
  if(historical&&files.some(f=>!f.name.toLowerCase().endsWith('.xlsx')))throw Error('Archivio storico: seleziona soltanto file XLSX');
  if(mode==='warehouse'&&!['DDT','FATTURA_ACQUISTO'].includes(kind))throw Error('Per il magazzino servono DDT o fatture di acquisto');
  const docs=[],legacyRows=[],legacyIssues=[],legacyStats=[];
  for(let i=0;i<files.length;i++){
   const file=files[i],extension=file.name.split('.').pop().toLowerCase();
   if(!allowed.has(extension)||file.size>(extension==='xlsx'?8*1024*1024:5000000))throw Error('Formato o dimensione non ammessi: '+file.name);
   const id=files.length===1?documentId:documentId+'#'+(i+1);
   if(historical){
    const parsed=ITEMaterialWorkbookRouter.inspect(await file.arrayBuffer(),{mode:'catalogue',legacyArchive:true,brand:$('brand').value,documentId:id});
    const result=parsed.legacyResult;
    legacyRows.push(...(result.preview?.rows||[]));
    legacyIssues.push(...result.issues.map(x=>(x.severity==='blocking'?'BLOCCANTE':'AVVISO')+' '+x.code+': '+x.message));
    legacyStats.push(...result.stats.map(s=>s.sheetName||s.sheet).filter(Boolean));
   }else{
    const parsed=extension==='xlsx'?ITEMaterialWorkbookRouter.inspect(await file.arrayBuffer(),{mode}):ITEMaterialDelimitedImport.parse(await file.text(),{delimiter:extension==='tsv'?'\t':undefined});
    docs.push({documentId:id,kind,received:$('received').checked,linkedDdtId:$('ddt').value.trim(),rows:parsed.rows});
   }
  }
  let rows=legacyRows,issues=legacyIssues,ready=legacyRows.length>0&&!legacyIssues.some(x=>x.startsWith('BLOCCANTE'));
  if(!historical){
   const validation=ITEMaterialDocumentValidation.validate(mode,docs);
   if(!validation.canPreview){report('Documenti non validi. Nessuna importazione.\n'+validation.issues.join('\n'));return}
   const result=ITEMaterialWorkflow.plan(mode,[],validation.accepted,[]);
   rows=result.preview.rows;
   issues=[...result.preview.issues,...(result.receipts?.issues||[]).map(x=>x.code+': '+x.message)];
   ready=result.canConfirm;
  }
  show(rows);
  report('File: '+files.length+' | Righe in anteprima: '+rows.length+' | Segnalazioni: '+issues.length+
    (legacyStats.length?'\nFogli analizzati: '+legacyStats.join(', '):'')+
    (issues.length?'\n'+issues.join('\n'):'')+
    '\n'+(ready?'Anteprima pronta per revisione.':'Verificare le segnalazioni.')+
    '\nNESSUNA REGISTRAZIONE: Archivio e Magazzino invariati.');
 }catch(e){report('Anteprima non eseguita: '+e.message)}
});
})();