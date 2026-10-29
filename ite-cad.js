/* I.T.E. 4.0 - CAD tecnico vettoriale, bozze locali non certificate.
   I disegni sono parte di commerce.settings.cadDrawings e del backup completo cifrato. */
(function(root){
'use strict';
const NS='http://www.w3.org/2000/svg', W=1000,H=650,MAX=200,GRID=10;
const KINDS=['wall','line','rect','dimension','label','symbol'], COLORS=['#173451','#285b84','#b03434','#16805d','#222222'];
const SYMBOLS=Object.freeze({presa:'Presa elettrica',interruttore:'Interruttore',quadro:'Quadro elettrico',lavabo:'Lavabo',wc:'WC',radiatore:'Radiatore',caldaia:'Caldaia',split:'Unità interna CDZ',valvola:'Valvola'});
const validScale=v=>v===undefined||v===null||(typeof v==='number'&&Number.isFinite(v)&&v>=0.01&&v<=100);
const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>String(a??'')===String(b??'');
let serial=0;const uid=p=>p+'_'+(root.crypto?.randomUUID?.()||'00000000-0000-4000-8000-'+String(++serial).padStart(12,'0'));
const clamp=(v,max)=>Math.max(0,Math.min(max,Math.round(Number(v)/GRID)*GRID));
const safeText=s=>String(s??'').trim().slice(0,120);
const finite=(n,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
function validateElement(e){
 if(!e||typeof e!=='object'||!/^e_[a-zA-Z0-9-]{8,70}$/.test(e.id)||!KINDS.includes(e.kind)||!finite(e.x,W)||!finite(e.y,H)||!finite(e.x2,W)||!finite(e.y2,H)||!COLORS.includes(e.color)||typeof e.text!=='string'||e.text.length>120||!Number.isInteger(e.rotation)||e.rotation<0||e.rotation>270||e.rotation%90||(e.groupId!==undefined&&!/^g_[a-zA-Z0-9-]{8,70}$/.test(e.groupId))||(e.kind==='symbol'&&!Object.prototype.hasOwnProperty.call(SYMBOLS,e.text)))throw Error('Elemento CAD non valido');
 return true;
}
function validateCollection(rows,db){
 if(rows===undefined)return true;
 if(!Array.isArray(rows)||rows.length>300)throw Error('Archivio disegni CAD non valido');
 const ids=new Set();
 for(const r of rows){
  if(!r||!/^cad_[a-zA-Z0-9-]{8,70}$/.test(r.id)||ids.has(r.id)||typeof r.title!=='string'||!r.title.trim()||r.title.length>120||!Number.isSafeInteger(r.revision)||r.revision<1||typeof r.updated!=='string'||!Number.isFinite(Date.parse(r.updated))||typeof r.archived!=='boolean'||!Array.isArray(r.elements)||r.elements.length>MAX||!Array.isArray(r.history)||r.history.length>30||!validScale(r.scaleCmPerUnit))throw Error('Disegno CAD non valido');
  ids.add(r.id);
  const client=(db?.clienti||[]).find(x=>same(x.id,r.clientId)),property=(db?.immobili||[]).find(x=>same(x.id,r.propertyId)),site=(db?.cantieri||[]).find(x=>same(x.id,r.siteId)),plant=(db?.impianti||[]).find(x=>same(x.id,r.plantId));
  if(!client||r.propertyId&&(!property||!same(property.client_id,client.id))||r.siteId&&(!site||!same(site.client_id,client.id))||r.plantId&&(!plant||!property||!same(plant.immobile_id,property.id))||site?.immobile_id&&property&&!same(site.immobile_id,property.id))throw Error('Collegamenti CAD incoerenti');
  const eids=new Set();
  for(const e of r.elements){validateElement(e);if(eids.has(e.id))throw Error('Elemento CAD duplicato');eids.add(e.id)}
  for(const h of r.history){if(!h||!Number.isSafeInteger(h.revision)||h.revision<1||typeof h.at!=='string'||!Number.isFinite(Date.parse(h.at))||!Array.isArray(h.elements)||h.elements.length>MAX||!validScale(h.scaleCmPerUnit))throw Error('Revisione CAD non valida');const seen=new Set();for(const e of h.elements){validateElement(e);if(seen.has(e.id))throw Error('Revisione CAD duplicata');seen.add(e.id)}}
 }
 return true;
}
function point(x,y){return {x:clamp(x,W),y:clamp(y,H)}}
function make(kind,a,b,text='',color=COLORS[0]){
 if(!KINDS.includes(kind)||!COLORS.includes(color))throw Error('Strumento CAD non valido');
 const p=point(a.x,a.y),q=point(b.x,b.y);
 if(kind!=='label'&&kind!=='symbol'&&p.x===q.x&&p.y===q.y)throw Error('Traccia almeno 10 unità');
 const e={id:uid('e'),kind,x:p.x,y:p.y,x2:q.x,y2:q.y,text:kind==='symbol'?String(text||'presa'):safeText(text),color,rotation:0};
 validateElement(e);return e;
}
function operate(elements,action,id,payload={}){
 if(!Array.isArray(elements)||elements.length>MAX)throw Error('Disegno troppo grande');
 const rows=copy(elements);rows.forEach(validateElement);
 const i=rows.findIndex(e=>e.id===id);
 if(action==='add'){if(rows.length>=MAX)throw Error('Limite 200 elementi');const e=payload.element;validateElement(e);if(rows.some(x=>x.id===e.id))throw Error('ID duplicato');rows.push(copy(e))}
 else if(action==='group'){
  const ids=payload.ids;if(!Array.isArray(ids)||ids.length<2||ids.length>MAX||new Set(ids).size!==ids.length||ids.some(x=>!rows.some(e=>e.id===x)))throw Error('Seleziona almeno due elementi distinti');
  const groupId=uid('g');for(const e of rows)if(ids.includes(e.id))e.groupId=groupId;
 }
 else{
  if(i<0)throw Error('Seleziona un elemento CAD');
  const members=rows[i].groupId?rows.filter(e=>e.groupId===rows[i].groupId):[rows[i]];
  if(action==='delete')rows.splice(i,1);
  else if(action==='duplicate'){
   if(rows.length+members.length>MAX)throw Error('Limite 200 elementi');
   const groupId=members.length>1?uid('g'):undefined;
   for(const original of members){const e=copy(original);e.id=uid('e');if(groupId)e.groupId=groupId;else delete e.groupId;
    e.x=clamp(e.x+20,W);e.y=clamp(e.y+20,H);e.x2=clamp(e.x2+20,W);e.y2=clamp(e.y2+20,H);rows.push(e)}
  }
  else if(action==='front'){rows.push(...rows.splice(i,1))}
  else if(action==='back'){rows.unshift(...rows.splice(i,1))}
  else if(action==='color'){if(!COLORS.includes(payload.color))throw Error('Colore non valido');for(const e of members)e.color=payload.color}
  else if(action==='rotate')rows[i].rotation=(rows[i].rotation+90)%360;
  else if(action==='ungroup'){if(!rows[i].groupId)throw Error('Elemento non raggruppato');for(const e of members)delete e.groupId;}
  else if(action==='move'){const dx=Number(payload.dx),dy=Number(payload.dy);if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>W||Math.abs(dy)>H)throw Error('Spostamento non valido');for(const e of members){for(const key of ['x','x2'])e[key]=clamp(e[key]+dx,W);for(const key of ['y','y2'])e[key]=clamp(e[key]+dy,H)}}
  else throw Error('Comando CAD sconosciuto');
 }
 rows.forEach(validateElement);return rows;
}
function snapPoint(p,elements,enabled=true,radius=18){
 const q=point(p.x,p.y);if(!enabled)return q;
 let best=radius+1,match=null;
 for(const e of elements){validateElement(e);const ends=e.kind==='symbol'||e.kind==='label'?[{x:e.x,y:e.y}]:[{x:e.x,y:e.y},{x:e.x2,y:e.y2}];
  for(const end of ends){const d=Math.hypot(q.x-end.x,q.y-end.y);if(d<best){best=d;match=end}}
 }
 return best<=radius?{...match}:q;
}
function materialSchedule(elements,scale=null){
 if(!Array.isArray(elements)||elements.length>MAX||!validScale(scale))throw Error('Distinta CAD non valida');
 const counts=new Map();let wallUnits=0,lineUnits=0;
 for(const e of elements){validateElement(e);if(e.kind==='symbol')counts.set(e.text,(counts.get(e.text)||0)+1);
  const len=Math.hypot(e.x2-e.x,e.y2-e.y);if(e.kind==='wall')wallUnits+=len;if(e.kind==='line')lineUnits+=len}
 const meters=u=>scale==null?null:Math.round(u*scale)/100;
 return {items:[...counts].sort((a,b)=>a[0].localeCompare(b[0])).map(([code,count])=>({code,label:SYMBOLS[code],count})),
  wallMeters:meters(wallUnits),lineMeters:meters(lineUnits),calibrated:scale!=null};
}
function references(rows,kind,id){
 const fields={clienti:'clientId',immobili:'propertyId',cantieri:'siteId',impianti:'plantId'};
 return (rows||[]).some(r=>fields[kind]&&same(r[fields[kind]],id));
}
function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
function svgElement(tag,attrs,text){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n}
function renderSvg(elements,selected='',draft=true,scale=null){
 if(!validScale(scale))throw Error('Scala CAD non valida');const chosen=new Set(Array.isArray(selected)?selected:[selected]);
 const svg=svgElement('svg',{xmlns:NS,viewBox:'0 0 '+W+' '+H,width:W,height:H,role:'img','aria-label':'Disegno tecnico CAD in bozza'});
 svg.append(svgElement('rect',{x:0,y:0,width:W,height:H,fill:'#ffffff'}));
 for(let x=0;x<=W;x+=50)svg.append(svgElement('line',{x1:x,y1:0,x2:x,y2:H,stroke:'#e5eaf0','stroke-width':1}));
 for(let y=0;y<=H;y+=50)svg.append(svgElement('line',{x1:0,y1:y,x2:W,y2:y,stroke:'#e5eaf0','stroke-width':1}));
 for(const e of elements){
  const group=svgElement('g',{'data-cad-id':e.id,tabindex:'0',role:'button','aria-label':e.kind+' '+e.id});
  const stroke=e.color,highlight=chosen.has(e.id)?'#f59e0b':stroke;
  if(e.kind==='symbol'){
   const sym=svgElement('g',{transform:'translate('+e.x+' '+e.y+') rotate('+e.rotation+')'});
   sym.append(svgElement('circle',{cx:0,cy:0,r:18,fill:'#ffffff',stroke:highlight,'stroke-width':3}));
   sym.append(svgElement('text',{x:0,y:5,'text-anchor':'middle',fill:highlight,'font-size':12,'font-family':'sans-serif','font-weight':'bold'},e.text==='interruttore'?'INT':e.text==='radiatore'?'RAD':e.text==='caldaia'?'CAL':e.text==='quadro'?'QE':e.text==='valvola'?'V':e.text==='lavabo'?'L':e.text==='presa'?'P':e.text==='split'?'CDZ':'WC'));
   group.append(sym);
  }
  else if(e.kind==='rect'){const x=Math.min(e.x,e.x2),y=Math.min(e.y,e.y2),w=Math.abs(e.x2-e.x),h=Math.abs(e.y2-e.y);const rect=svgElement('rect',{x,y,width:w,height:h,fill:'none',stroke:highlight,'stroke-width':e.id===selected?5:3});if(e.rotation)rect.setAttribute('transform','rotate('+e.rotation+' '+((e.x+e.x2)/2)+' '+((e.y+e.y2)/2)+')');group.append(rect)}
  else if(e.kind==='label'){const label=svgElement('text',{x:e.x,y:e.y,fill:highlight,'font-size':18,'font-family':'sans-serif'},e.text||'Etichetta');if(e.rotation)label.setAttribute('transform','rotate('+e.rotation+' '+e.x+' '+e.y+')');group.append(label)}
  else{
   group.append(svgElement('line',{x1:e.x,y1:e.y,x2:e.x2,y2:e.y2,stroke:highlight,'stroke-width':e.kind==='wall'?9:e.kind==='dimension'?2:3,'stroke-linecap':'round'}));
   if(e.kind==='dimension'){const length=Math.hypot(e.x2-e.x,e.y2-e.y);const measured=scale==null?Math.round(length)+' u':(Math.round(length*scale*10)/10)+' cm';group.append(svgElement('text',{x:(e.x+e.x2)/2,y:(e.y+e.y2)/2-9,fill:highlight,'font-size':16,'font-family':'sans-serif','text-anchor':'middle'},e.text||measured))}
  }
  svg.append(group);
 }
 if(scale!=null)svg.append(svgElement('text',{x:15,y:24,fill:'#173451','font-size':14,'font-family':'sans-serif'},'Scala di lavoro: 1 u = '+scale+' cm (da verificare)'));
 if(draft)svg.append(svgElement('text',{x:W/2,y:H-12,'text-anchor':'middle',fill:'#b03434','font-size':18,'font-family':'sans-serif'},'I.T.E. 4.0 — BOZZA CAD — quote da verificare'));
 return svg;
}
function mount(){
 const host=document.getElementById('ite-cad');if(!host||host.dataset.mounted)return;
 host.dataset.mounted='1';
 const state={current:null,elements:[],selected:'',selectedIds:[],multi:false,snap:true,scale:null,tool:'select',start:null,drag:null,undo:[],redo:[],dirty:false,saving:false};
 const h=el('h2','Disegno tecnico I.T.E. CAD — bozza vettoriale'),note=el('p','Strumenti per muri, linee, rettangoli, simboli impiantistici, quote, gruppi e distinta indicativa. La scala in cm è inserita dal tecnico e deve essere verificata sul posto. Ogni salvataggio crea un backup preventivo e una revisione.','hint');
 host.append(h,note);
 const selectors=el('div');selectors.className='grid';
 const mkSelect=(title)=>{const l=el('label',title),s=el('select');l.append(s);selectors.append(l);return s};
 const client=mkSelect('Cliente'),property=mkSelect('Sede / immobile'),site=mkSelect('Cantiere'),plant=mkSelect('Impianto');
 const title=el('input');title.maxLength=120;title.placeholder='Titolo del disegno';const titleLabel=el('label','Titolo del disegno');titleLabel.append(title);selectors.append(titleLabel);host.append(selectors);
 const options=el('div');options.className='actions';host.append(options);
 const scaleLabel=el('label','Scala di lavoro (cm per unità grafica)'),scaleInput=el('input');scaleInput.type='number';scaleInput.min='0.01';scaleInput.max='100';scaleInput.step='0.01';scaleInput.placeholder='Non calibrata';scaleLabel.append(scaleInput);options.append(scaleLabel);
 const symbolLabel=el('label','Simbolo impiantistico'),symbolSelect=el('select');for(const [code,label] of Object.entries(SYMBOLS))symbolSelect.append(new Option(label,code));symbolLabel.append(symbolSelect);options.append(symbolLabel);
 const list=mkSelect('Disegni salvati (seleziona per aprire)');host.append(list.parentElement);
 const toolbar=el('div');toolbar.className='actions';host.append(toolbar);
 const status=el('p','','hint');status.setAttribute('role','status');host.append(status);
 const canvas=el('div');canvas.style.cssText='overflow:auto;touch-action:pan-x pan-y;border:1px solid #b5c6d7;background:white;max-width:100%';host.append(canvas);
 const commands=el('div');commands.className='actions';host.append(commands);
 const scheduleBox=el('div');scheduleBox.setAttribute('aria-label','Distinta materiali indicativa');host.append(scheduleBox);
 const say=s=>{status.textContent=s};
 const button=(where,label,fn)=>{const b=el('button',label);b.type='button';b.addEventListener('click',fn);where.append(b);return b};
 const option=(s,value,label)=>s.append(new Option(label,value));
 const fill=(s,rows,placeholder)=>{const old=s.value;s.replaceChildren();option(s,'',placeholder);for(const r of rows)option(s,String(r.id),String(r.name||r.title||r.address||'#'+r.id));s.value=rows.some(r=>same(r.id,old))?old:''};
 const database=()=>root.ITE.snapshot();
 function cascade(){const db=database();fill(property,(db.immobili||[]).filter(r=>same(r.client_id,client.value)),'— Sede facoltativa —');fill(site,(db.cantieri||[]).filter(r=>same(r.client_id,client.value)),'— Cantiere facoltativo —');fill(plant,(db.impianti||[]).filter(r=>same(r.immobile_id,property.value)),'— Impianto facoltativo —')}
 function refreshChoices(){const db=database();fill(client,db.clienti||[],'— Seleziona cliente —');cascade();const drawings=root.ITECommerce.snapshot().settings.cadDrawings||[];fill(list,drawings.filter(r=>!r.archived),'— Nuovo disegno —')}
 client.addEventListener('change',cascade);property.addEventListener('change',()=>{const db=database();fill(plant,(db.impianti||[]).filter(r=>same(r.immobile_id,property.value)),'— Impianto facoltativo —')});
 function snapshot(){state.undo.push({elements:copy(state.elements),scale:state.scale});if(state.undo.length>60)state.undo.shift();state.redo.length=0}
 function update(next){snapshot();state.elements=next;state.dirty=true;paint()}
 function paint(){
  const svg=renderSvg(state.elements,state.selectedIds.length?state.selectedIds:state.selected,true,state.scale);
  svg.style.cssText='width:100%;height:auto;min-width:450px;touch-action:none';canvas.replaceChildren(svg);
  svg.addEventListener('pointerdown',down);svg.addEventListener('pointerup',up);
  svg.addEventListener('pointercancel',()=>{state.start=null;state.drag=null});svg.addEventListener('pointermove',move);
  const summary=materialSchedule(state.elements,state.scale);scheduleBox.replaceChildren(el('h3','Distinta preliminare (non è un ordine materiali)'));
  for(const item of summary.items)scheduleBox.append(el('p',item.label+' · quantità: '+item.count));
  scheduleBox.append(el('p',summary.calibrated?'Muri: '+summary.wallMeters+' m · Linee: '+summary.lineMeters+' m (indicativi)':'Lunghezze non disponibili: calibrare la scala'));
  say(state.elements.length+' elementi · '+(state.dirty?'Modifiche da salvare':'Salvato / nuova bozza')+' · strumento '+state.tool+(state.multi?' · selezione multipla':''));
 }
 const coord=e=>{const svg=canvas.querySelector('svg'),r=svg.getBoundingClientRect();return snapPoint(point((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height),state.elements,state.snap&&state.tool!=='select')};
 function down(e){if(e.button!==0)return;const p=coord(e),target=e.target.closest('[data-cad-id]'),id=target?.getAttribute('data-cad-id')||'';
  if(state.multi){if(id){state.selectedIds=state.selectedIds.includes(id)?state.selectedIds.filter(x=>x!==id):[...state.selectedIds,id];state.selected=id}state.start=null;paintSelection();return}
  state.selectedIds=[];state.selected=id;state.start=p;state.drag=state.tool==='select'&&state.selected?p:null;e.currentTarget.setPointerCapture?.(e.pointerId);paintSelection()}
 function paintSelection(){for(const node of canvas.querySelectorAll('[data-cad-id]'))node.style.opacity=(state.selectedIds.length?state.selectedIds.includes(node.getAttribute('data-cad-id')):node.getAttribute('data-cad-id')===state.selected)?'1':state.multi?'0.35':'0.9'}
 function move(e){if(!state.start)return;const p=coord(e);status.textContent='Da ('+state.start.x+','+state.start.y+') a ('+p.x+','+p.y+') · '+Math.round(Math.hypot(p.x-state.start.x,p.y-state.start.y))+' unità grafiche'}
 function up(e){if(!state.start)return;const p=coord(e),start=state.start;state.start=null;
  try{if(state.tool==='select'){if(state.drag&&state.selected&&(p.x!==start.x||p.y!==start.y))update(operate(state.elements,'move',state.selected,{dx:p.x-start.x,dy:p.y-start.y}));else paint();state.drag=null;return}
   const text=state.tool==='symbol'?symbolSelect.value:state.tool==='label'?root.prompt('Testo etichetta (max 120 caratteri)','')||'':state.tool==='dimension'?root.prompt('Quota (facoltativa; verificare sul posto)','')||'':'';
   const element=make(state.tool,start,state.tool==='symbol'?start:p,text);update(operate(state.elements,'add','',{element}));state.selected=element.id;
  }catch(err){say(err.message)}
 }
 for(const [key,label] of [['select','Seleziona / sposta'],['wall','Muro'],['line','Linea'],['rect','Rettangolo'],['dimension','Quota'],['label','Testo'],['symbol','Simbolo']])button(toolbar,label,()=>{state.tool=key;state.start=null;state.multi=false;state.selectedIds=[];multiButton.textContent='Selezione multipla: OFF';paint();say('Strumento: '+label)});
 const action=(label,fn)=>button(commands,label,()=>{try{fn()}catch(err){say(err.message)}});
 const multiButton=button(toolbar,'Selezione multipla: OFF',function(){state.multi=!state.multi;state.tool='select';state.selectedIds=[];this.textContent='Selezione multipla: '+(state.multi?'ON':'OFF');paint()});
 button(toolbar,'Aggancio estremi: ON',function(){state.snap=!state.snap;this.textContent='Aggancio estremi: '+(state.snap?'ON':'OFF');paint()});
 action('Raggruppa selezionati',()=>{const next=operate(state.elements,'group','',{ids:state.selectedIds});update(next);state.selectedIds=[];state.multi=false;multiButton.textContent='Selezione multipla: OFF';paint()});
 action('Separa gruppo',()=>update(operate(state.elements,'ungroup',state.selected)));
 action('Calibra segmento (cm)',()=>{
  const selected=state.elements.find(e=>e.id===state.selected);
  if(!selected||!['wall','line','dimension'].includes(selected.kind))throw Error('Seleziona un muro, linea o quota');
  const length=Math.hypot(selected.x2-selected.x,selected.y2-selected.y);
  const value=root.prompt('Lunghezza reale del segmento in centimetri (misurata sul posto)','');
  if(value===null)return;
  const cm=Number(String(value).replace(',','.')),scale=cm/length;
  if(!Number.isFinite(cm)||cm<=0||!validScale(scale))throw Error('Misura o scala non valida');
  snapshot();state.scale=scale;scaleInput.value=String(scale);state.dirty=true;paint();
 });
 scaleInput.addEventListener('change',()=>{
  try{const value=scaleInput.value.trim()===''?null:Number(scaleInput.value);
   if(!validScale(value))throw Error('Scala ammessa: da 0,01 a 100 cm per unità');
   if(value!==state.scale){snapshot();state.scale=value;state.dirty=true;paint()}
  }catch(err){scaleInput.value=state.scale==null?'':String(state.scale);say(err.message)}
 });
 for(const [label,kind] of [['Duplica','duplicate'],['Ruota 90°','rotate'],['Porta avanti','front'],['Porta indietro','back'],['Elimina elemento','delete']])action(label,()=>update(operate(state.elements,kind,state.selected)));
 for(const color of COLORS)action('Colore '+color,()=>update(operate(state.elements,'color',state.selected,{color})));
 action('Annulla',()=>{if(!state.undo.length)return;state.redo.push({elements:copy(state.elements),scale:state.scale});const prior=state.undo.pop();state.elements=prior.elements;state.scale=prior.scale;scaleInput.value=state.scale==null?'':String(state.scale);state.dirty=true;paint()});
 action('Ripeti',()=>{if(!state.redo.length)return;state.undo.push({elements:copy(state.elements),scale:state.scale});const next=state.redo.pop();state.elements=next.elements;state.scale=next.scale;scaleInput.value=state.scale==null?'':String(state.scale);state.dirty=true;paint()});
 function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
 action('Esporta SVG (bozza)',()=>{const xml=new XMLSerializer().serializeToString(renderSvg(state.elements,'',true,state.scale));download(xml,'ITE-CAD-bozza.svg','image/svg+xml')});
 action('Esporta JSON',()=>{const data={format:'ITE-CAD-DRAFT',schema:2,title:title.value,scaleCmPerUnit:state.scale,elements:state.elements};download(JSON.stringify(data,null,2),'ITE-CAD-bozza.json','application/json')});
 action('Esporta distinta CSV (indicativa)',()=>{
  const summary=materialSchedule(state.elements,state.scale),lines=['Codice;Descrizione;Quantita;Unita'];
  const csvRow=fields=>fields.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';');
  for(const item of summary.items)lines.push(csvRow([item.code,item.label,item.count,'pz']));
  if(summary.calibrated){lines.push(csvRow(['MURI','Lunghezza totale muri',summary.wallMeters,'m']));lines.push(csvRow(['LINEE','Lunghezza totale linee',summary.lineMeters,'m']))}
  download('\uFEFF'+lines.join('\r\n'),'ITE-CAD-distinta-bozza.csv','text/csv;charset=utf-8');
 });
 const upload=el('input');upload.type='file';upload.accept='.json,application/json';const uploadLabel=el('label','Importa disegno JSON in bozza');uploadLabel.append(upload);host.append(uploadLabel);
 upload.addEventListener('change',async()=>{try{const f=upload.files[0];if(!f)return;if(f.size>250000)throw Error('File CAD troppo grande');const data=JSON.parse(await f.text());if(data.format!=='ITE-CAD-DRAFT'||![1,2].includes(data.schema)||!validScale(data.scaleCmPerUnit)||!Array.isArray(data.elements)||data.elements.length>MAX)throw Error('Formato CAD non valido');const ids=new Set();for(const e of data.elements){validateElement(e);if(ids.has(e.id))throw Error('Elementi duplicati');ids.add(e.id)}update(copy(data.elements));state.scale=data.scaleCmPerUnit??null;scaleInput.value=state.scale==null?'':String(state.scale);title.value=safeText(data.title)||title.value;paint();say('Bozza importata: verifica cliente e sede prima di salvare.')}catch(err){say(err.message)}finally{upload.value=''}});
 async function save(archived=false){
  if(state.saving)throw Error('Salvataggio CAD già in corso');state.saving=true;
  try{
  if(!root.ITEVault?.isUnlocked?.())throw Error('Archivio cifrato bloccato');
  const db=database(),old=root.ITECommerce.snapshot().settings.cadDrawings||[],previous=old.find(x=>same(x.id,state.current));
  const record={id:previous?.id||uid('cad'),title:safeText(title.value),clientId:client.value,propertyId:property.value,siteId:site.value,plantId:plant.value,updated:new Date().toISOString(),archived,revision:(previous?.revision||0)+1,scaleCmPerUnit:state.scale,elements:copy(state.elements),history:previous?[...previous.history,{revision:previous.revision,at:previous.updated,scaleCmPerUnit:previous.scaleCmPerUnit??null,elements:copy(previous.elements)}].slice(-30):[]};
  if(!record.title)throw Error('Indica il titolo');validateCollection([record],db);
  if(root.ITEBackup?.busy?.())throw Error('Backup già in corso');
  await root.ITEHistory.create('Prima modifica CAD '+record.title);
  await root.ITECommerce.mutate(next=>{const rows=next.settings.cadDrawings||[];const index=rows.findIndex(r=>same(r.id,record.id));if(previous&&index<0)throw Error('Disegno modificato da altra sessione');if(index>=0){if(rows[index].revision!==previous.revision)throw Error('Revisione CAD cambiata: riapri il disegno');rows[index]=record}else rows.push(record);next.settings.cadDrawings=rows});
  state.current=record.id;state.dirty=false;state.undo=[];state.redo=[];refreshChoices();list.value=record.id;paint();say('Disegno '+(archived?'archiviato':'salvato')+' con backup preventivo · revisione '+record.revision);
  }finally{state.saving=false}
 }
 button(commands,'Salva con backup e revisione',()=>save().catch(e=>say(e.message)));
 button(commands,'Archivia (non elimina)',()=>{if(!state.current)return say('Apri un disegno salvato');if(root.confirm('Archiviare il disegno conservando lo storico?'))save(true).catch(e=>say(e.message))});
 button(commands,'Nuovo',()=>{if(state.dirty&&!root.confirm('Abbandonare le modifiche non salvate?'))return;state.current=null;state.elements=[];state.selected='';state.selectedIds=[];state.scale=null;scaleInput.value='';state.undo=[];state.redo=[];state.dirty=false;title.value='';list.value='';paint()});
 list.addEventListener('change',()=>{if(!list.value)return;if(state.dirty&&!root.confirm('Abbandonare le modifiche non salvate?'))return;const record=(root.ITECommerce.snapshot().settings.cadDrawings||[]).find(r=>same(r.id,list.value));if(!record)return;state.current=record.id;state.elements=copy(record.elements);state.scale=record.scaleCmPerUnit??null;scaleInput.value=state.scale==null?'':String(state.scale);state.undo=[];state.redo=[];state.selected='';state.selectedIds=[];state.dirty=false;title.value=record.title;client.value=record.clientId;cascade();property.value=record.propertyId;site.value=record.siteId;const db=database();fill(plant,(db.impianti||[]).filter(r=>same(r.immobile_id,property.value)),'— Impianto facoltativo —');plant.value=record.plantId;paint()});
 refreshChoices();paint();
 root.addEventListener('beforeunload',event=>{if(state.dirty){event.preventDefault();event.returnValue='';}});
}
const api=Object.freeze({KINDS,COLORS,SYMBOLS,validScale,snapPoint,materialSchedule,validateElement,validateCollection,make,operate,references,renderSvg,mount});
root.ITECad=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined')root.addEventListener('ite-vault-ready',mount);
})(typeof globalThis!=='undefined'?globalThis:this);
