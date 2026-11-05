/* I.T.E. 4.0 — acquisizione PDF locale, soltanto documenti TEST.
   Nessun PDF, testo o dato viene trasmesso o conservato: soltanto metadati sintetici
   dopo conferma esplicita. PDF.js deve essere disponibile localmente nella pagina. */
(function(root){'use strict';
const MAX_BYTES=8*1024*1024,MAX_PAGES=12,MAX_CHARS=200000;
function pdfEngine(){return root.pdfjsLib||root['pdfjs-dist/build/pdf']||null}
async function extract(file,engine){
 if(!file||typeof file.arrayBuffer!=='function'||file.size>MAX_BYTES||file.size<8)throw Error('PDF_DIMENSIONE_NON_VALIDA');
 if(!/\.pdf$/i.test(file.name||'')||file.type&&file.type!=='application/pdf')throw Error('SOLO_FILE_PDF');
 if(!engine&&!pdfEngine()&&root.ITEPDFLocalReader){const extracted=await root.ITEPDFLocalReader.extract(file);if(extracted.pages>MAX_PAGES)throw Error('PDF_TROPPE_PAGINE');if(!extracted.text.trim())throw Error('PDF_SCANSIONE_SENZA_TESTO');if(!/\\bTEST[- _]/i.test(extracted.text))throw Error('SOLO_PDF_FITTIZI_TEST');return {text:extracted.text,pages:extracted.pages,bytes:file.size,filename:file.name};}\n const pdf=engine||pdfEngine();if(!pdf||typeof pdf.getDocument!=='function')throw Error('MOTORE_PDF_NON_DISPONIBILE');
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('FIRMA_PDF_NON_VALIDA');
 let doc;try{
  const task=pdf.getDocument({data:bytes,useSystemFonts:true,disableFontFace:true});
  doc=await task.promise;
  if(!doc.numPages||doc.numPages>MAX_PAGES)throw Error('PDF_TROPPE_PAGINE');
  const pages=[];
  for(let i=1;i<=doc.numPages;i++){
   const page=await doc.getPage(i), content=await page.getTextContent();
   const words=(content.items||[]).map(x=>typeof x.str==='string'?x.str:'');
   pages.push(words.join(' ').slice(0,MAX_CHARS));
  }
  const text=pages.join('\n');
  if(!text.trim())throw Error('PDF_SCANSIONE_SENZA_TESTO');
  if(text.length>MAX_CHARS)throw Error('PDF_TESTO_TROPPO_LUNGO');
  if(!/\bTEST[- _]/i.test(text))throw Error('SOLO_PDF_FITTIZI_TEST');
  return {text,pages:doc.numPages,bytes:file.size,filename:file.name};
 }finally{if(doc&&typeof doc.destroy==='function')await doc.destroy()}
}
function preview(text,kind,intake){const api=intake||root.ITEPdfIntake;if(!api)throw Error('MODULO_INTAKE_NON_DISPONIBILE');const normalized=String(text).replace(/\\s+(?=(?:Numero|Data|Committente|Indirizzo|Impianto)\\s*:)/gi,'\\n');return api.parse(normalized,kind)}
function mount(){
 const panel=document.getElementById('ite-tech-panel');
 if(!panel||document.getElementById('ite-local-pdf'))return;
 const field=document.createElement('fieldset');field.id='ite-local-pdf';
 field.innerHTML='<legend>PDF locale — collaudo con documenti fittizi</legend>'+
 '<p class="hint">Seleziona soltanto PDF sintetici TEST-. Il file rimane sul dispositivo; vengono letti i testi e proposti i campi da verificare. Nessun PDF viene salvato o inviato. PDF scansionati senza testo non sono supportati.</p>'+
 '<label>PDF di prova<input id="ite-local-pdf-file" type="file" accept=".pdf,application/pdf"></label>'+
 '<div class="actions"><button type="button" id="ite-local-pdf-preview">Leggi PDF e mostra anteprima</button><button type="button" id="ite-local-pdf-import" disabled>Registra bozza TEST</button></div>'+
 '<pre id="ite-local-pdf-result" style="white-space:pre-wrap;overflow-wrap:anywhere" role="status"></pre>';
 panel.insertBefore(field,panel.firstChild.nextSibling);
 const $=id=>document.getElementById('ite-local-pdf-'+id);
 let selected=null;
 $('file').addEventListener('change',()=>{selected=null;$('import').disabled=true;$('result').textContent=''});
 $('preview').addEventListener('click',async()=>{
  selected=null;$('import').disabled=true;
  try{
   const file=$('file').files?.[0], extracted=await extract(file);
   const kind=document.getElementById('ite-tech-kind').value;
   const parsed=preview(extracted.text,kind);
   selected={extracted,parsed,kind};
   $('result').textContent=JSON.stringify({file:extracted.filename,pages:extracted.pages,fields:parsed.fields,missing:parsed.missing,requiresReview:true},null,2);
   $('import').disabled=parsed.missing.length>0;
  }catch(e){$('result').textContent='Acquisizione bloccata: '+e.message}
 });
 $('import').addEventListener('click',()=>{
  if(!selected)return;
  if(selected.kind!==document.getElementById('ite-tech-kind').value){$('result').textContent='Tipologia cambiata: ripetere anteprima';return}
  const text=document.getElementById('ite-tech-pdf-text');
  if(!text){$('result').textContent='Modulo registro non disponibile';return}
  text.value=selected.extracted.text.replace(/\\s+(?=(?:Numero|Data|Committente|Indirizzo|Impianto)\\s*:)/gi,'\\n');
  document.getElementById('ite-tech-pdf-import').click();
  $('result').textContent+='\nRichiesta di registrazione inoltrata al registro TEST. Controllare il messaggio e la bozza.';
  selected=null;$('import').disabled=true;
 });
}
const api=Object.freeze({extract,preview,MAX_BYTES,MAX_PAGES});
root.ITELocalPdf=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount()}
})(typeof window!=='undefined'?window:globalThis);
