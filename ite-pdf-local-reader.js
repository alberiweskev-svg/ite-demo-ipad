/* I.T.E. 4.0 — PDF text extraction, entirely in the browser. No uploads or persistence. */
(function(root){'use strict';
const MAX_BYTES=15*1024*1024,MAX_PAGES=80,MAX_CHARS=250000;
function validate(file){if(!file||typeof file.arrayBuffer!=='function')throw Error('FILE_NON_VALIDO');if(!/\.pdf$/i.test(String(file.name||''))||file.type&&file.type!=='application/pdf')throw Error('SOLO_PDF');if(file.size<=0||file.size>MAX_BYTES)throw Error('DIMENSIONE_PDF_NON_AMMESSA');}
async function extract(file,options={}){
 validate(file);
 const load=options.loadPdf||(()=>import('./vendor/pdf.mjs'));
 const pdfjs=await load();
 if(!pdfjs||typeof pdfjs.getDocument!=='function')throw Error('LETTORE_PDF_NON_DISPONIBILE');
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.length!==file.size||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('PDF_NON_VALIDO');
 const task=pdfjs.getDocument({data:bytes,disableFontFace:true,useSystemFonts:false});
 let pdf;
 try{
 pdf=await task.promise;
 if(pdf.numPages>MAX_PAGES)throw Error('TROPPE_PAGINE');
 const pages=[];let chars=0;
 for(let i=1;i<=pdf.numPages;i++){
  const page=await pdf.getPage(i);
  const content=await page.getTextContent();
  const str=content.items.map(x=>typeof x.str==='string'?x.str:'').join(' ').trim();
  chars+=str.length;
  if(chars>MAX_CHARS)throw Error('TESTO_TROPPO_LUNGO');
  pages.push(str);
 }
 const text=pages.join('\n');
 return {filename:String(file.name).slice(0,180),text,pages:pdf.numPages,needsOCR:text.trim().length<20,localOnly:true};
 }catch(e){if(/PasswordException|password/i.test(String(e&&e.name||'')+' '+String(e&&e.message||'')))throw Error('PDF_PROTETTO_DA_PASSWORD');throw e}
 finally{if(pdf&&typeof pdf.destroy==='function')await pdf.destroy();else if(task&&typeof task.destroy==='function')await task.destroy();}
}
const api=Object.freeze({validate,extract,MAX_BYTES,MAX_PAGES});
root.ITEPDFLocalReader=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
