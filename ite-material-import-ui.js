(function(){'use strict';
const $=id=>document.getElementById(id);
const allowed=new Set(['csv','tsv']);
function setReport(message){$('report').textContent=message}
$('preview').addEventListener('click',async()=>{
 $('rows').replaceChildren();
 try{
  const mode=$('mode').value,kind=$('kind').value,files=Array.from($('files').files);
  if(!files.length||files.length>100)throw Error('Seleziona da 1 a 100 file CSV/TSV.');
  if(mode==='warehouse'&&!['DDT','FATTURA_ACQUISTO'].includes(kind))throw Error('Per il magazzino seleziona DDT o fattura acquisto.');
  const id=$('docid').value.trim();if(!id)throw Error('Inserisci un identificativo documento.');
  const docs=[];
  for(let i=0;i<files.length;i++){
   const file=files[i],extension=file.name.split('.').pop().toLowerCase();
   if(!allowed.has(extension)||file.size>5000000)throw Error('Formato o dimensione non ammessi: '+file.name);
   const text=await file.text();
   const parsed=ITEMaterialDelimitedImport.parse(text,{delimiter:extension==='tsv'?'\t':undefined});
   docs.push({documentId:files.length===1?id:id+'#'+(i+1),kind,received:$('received').checked,linkedDdtId:$('ddt').value.trim(),rows:parsed.rows});
  }
  const validation=ITEMaterialDocumentValidation.validate(mode,docs);
  if(!validation.canPreview){setReport('Documenti non validi. Nessuna importazione.\\n'+validation.issues.join('\\n'));return;}
  const result=ITEMaterialWorkflow.plan(mode,[],validation.accepted,[]);
  const lines=result.preview.rows;
  for(const row of lines){
   const tr=document.createElement('tr');
   for(const value of [row.documentId,row.article.manufacturerCode,row.article.description,row.quantity??'—',row.action]){
    const td=document.createElement('td');td.textContent=String(value);tr.append(td);
   }$('rows').append(tr);
  }
  const issues=[...result.preview.issues,...(result.receipts?.issues||[]).map(x=>x.code+': '+x.message)];
  setReport('File: '+files.length+' | Righe valide: '+lines.length+' | Segnalazioni: '+issues.length+'\n'+issues.join('\n')+'\n'+(result.canConfirm?'Anteprima coerente, ma registrazione disabilitata.':'Controlli da risolvere. Nessuna registrazione.'));
 }catch(e){setReport('Importazione non eseguita: '+e.message)}
});
})();