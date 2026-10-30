/* I.T.E. 4.0 - CAD tecnico vettoriale, bozze locali non certificate.
   I disegni sono parte di commerce.settings.cadDrawings e del backup completo cifrato. */
(function(root){
'use strict';
const NS='http://www.w3.org/2000/svg', W=1000,H=650,MAX=200,GRID=10;
const KINDS=['wall','line','rect','dimension','label','symbol'], COLORS=['#173451','#285b84','#b03434','#16805d','#222222'];
const LAYERS=Object.freeze({arch:'Architettura',idr:'Idrico',term:'Riscaldamento',ele:'Elettrico',cdz:'Climatizzazione',gas:'Gas',quote:'Quote e note'});
const layerOf=e=>e.layer||'arch';
const SYMBOLS=Object.freeze({presa:'Presa elettrica',interruttore:'Interruttore',quadro:'Quadro elettrico',lavabo:'Lavabo',wc:'WC',radiatore:'Radiatore',caldaia:'Caldaia',split:'Unità interna CDZ',valvola:'Valvola'});
const validScale=v=>v===undefined||v===null||(typeof v==='number'&&Number.isFinite(v)&&v>=0.01&&v<=100);
const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>String(a??'')===String(b??'');
let serial=0;const uid=p=>p+'_'+(root.crypto?.randomUUID?.()||'00000000-0000-4000-8000-'+String(++serial).padStart(12,'0'));
const clamp=(v,max)=>Math.max(0,Math.min(max,Math.round(Number(v)/GRID)*GRID));
const safeText=s=>String(s??'').trim().slice(0,120);
const finite=(n,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
function validateElement(e){
 if(!e||typeof e!=='object'||!/^e_[a-zA-Z0-9-]{8,70}$/.test(e.id)||!KINDS.includes(e.kind)||!finite(e.x,W)||!finite(e.y,H)||!finite(e.x2,W)||!finite(e.y2,H)||!COLORS.includes(e.color)||typeof e.text!=='string'||e.text.length>120||!Number.isInteger(e.rotation)||e.rotation<0||e.rotation>270||e.rotation%90||(e.groupId!==undefined&&!/^g_[a-zA-Z0-9-]{8,70}$/.test(e.groupId))||((e.layer!==undefined&&!Object.prototype.hasOwnProperty.call(LAYERS,e.layer))||(e.locked!==undefined&&typeof e.locked!=='boolean'))||(e.kind==='symbol'&&!Object.prototype.hasOwnProperty.call(SYMBOLS,e.text))||(e.articleId!==undefined&&(e.kind!=='symbol'||typeof e.articleId!=='string'||!/^art_[a-zA-Z0-9-]{8,70}$/.test(e.articleId))))throw Error('Elemento CAD non valido');
 return true;
}
function validateCollection(rows,db,articles){
 if(rows===undefined)return true;
 if(!Array.isArray(rows)||rows.length>300)throw Error('Archivio disegni CAD non valido');
 const ids=new Set();
 for(const r of rows){
  if(!r||!/^cad_[a-zA-Z0-9-]{8,70}$/.test(r.id)||ids.has(r.id)||typeof r.title!=='string'||!r.title.trim()||r.title.length>120||!Number.isSafeInteger(r.revision)||r.revision<1||typeof r.updated!=='string'||!Number.isFinite(Date.parse(r.updated))||typeof r.archived!=='boolean'||!Array.isArray(r.elements)||r.elements.length>MAX||!Array.isArray(r.history)||r.history.length>30||!validScale(r.scaleCmPerUnit))throw Error('Disegno CAD non valido');
  ids.add(r.id);
  const client=(db?.clienti||[]).find(x=>same(x.id,r.clientId)),property=(db?.immobili||[]).find(x=>same(x.id,r.propertyId)),site=(db?.cantieri||[]).find(x=>same(x.id,r.siteId)),plant=(db?.impianti||[]).find(x=>same(x.id,r.plantId));
  if(!client||r.propertyId&&(!property||!same(property.client_id,client.id))||r.siteId&&(!site||!same(site.client_id,client.id))||r.plantId&&(!plant||!property||!same(plant.immobile_id,property.id))||site?.immobile_id&&property&&!same(site.immobile_id,property.id))throw Error('Collegamenti CAD incoerenti');
  const eids=new Set();
  for(const e of r.elements){validateElement(e);if(eids.has(e.id))throw Error('Elemento CAD duplicato');eids.add(e.id);if(e.articleId&&articles&&!articles.some(a=>same(a.id,e.articleId)&&a.kind==='Materiale'))throw Error('Materiale CAD non presente nel catalogo')}
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
/* Trasformazioni CAD: coordinate validate prima di modificare la bozza. */
function onGrid(n,max){
 if(!Number.isFinite(n))throw Error('Coordinata CAD non valida');
 const value=Math.round(n/GRID)*GRID;
 if(value<0||value>max)throw Error('Trasformazione fuori dal foglio: nessun elemento modificato');
 return value;
}
function geometryMembers(rows,index){
 const item=rows[index];
 return item.groupId?rows.filter(e=>e.groupId===item.groupId):[item];
}
function bounds(elements){
 const xs=elements.flatMap(e=>[e.x,e.x2]),ys=elements.flatMap(e=>[e.y,e.y2]);
 return {cx:(Math.min(...xs)+Math.max(...xs))/2,cy:(Math.min(...ys)+Math.max(...ys))/2};
}
function transformMembers(members,transform){
 const changed=members.map(e=>copy(e));
 for(const e of changed){
  const a=transform(e.x,e.y),b=transform(e.x2,e.y2);
  e.x=onGrid(a.x,W);e.y=onGrid(a.y,H);e.x2=onGrid(b.x,W);e.y2=onGrid(b.y,H);
  if(!['label','symbol'].includes(e.kind)&&e.x===e.x2&&e.y===e.y2)
   throw Error('Trasformazione che annulla un segmento: nessuna modifica');
 }
 return changed;
}
function operate(elements,action,id,payload={}){
 if(!Array.isArray(elements)||elements.length>MAX)throw Error('Disegno troppo grande');
 const rows=copy(elements);rows.forEach(validateElement);
 const i=rows.findIndex(e=>e.id===id);
 if(action==='add'){
  if(rows.length>=MAX)throw Error('Limite 200 elementi');
  const e=payload.element;validateElement(e);
  if(rows.some(x=>x.id===e.id))throw Error('ID duplicato');
  rows.push(copy(e));
 }else if(action==='group'){
  const ids=payload.ids;
  if(!Array.isArray(ids)||ids.length<2||ids.length>MAX||new Set(ids).size!==ids.length||ids.some(x=>!rows.some(e=>e.id===x)))
   throw Error('Seleziona almeno due elementi distinti');
  const selected=new Set(ids);
  if(rows.some(e=>e.groupId&&selected.has(e.id)&&rows.some(other=>other.groupId===e.groupId&&!selected.has(other.id))))
   throw Error('Selezione parziale di un gruppo: seleziona tutti gli elementi');
  if(rows.some(e=>selected.has(e.id)&&e.locked))throw Error('Elemento bloccato: sblocca prima di raggruppare');
  const groupId=uid('g');for(const e of rows)if(selected.has(e.id))e.groupId=groupId;
 }else{
  if(i<0)throw Error('Seleziona un elemento CAD');
  const members=geometryMembers(rows,i),memberIds=new Set(members.map(e=>e.id));
  if(!['lock','unlock'].includes(action)&&members.some(e=>e.locked))throw Error('Elemento o gruppo bloccato: sblocca prima di modificare');
  if(action==='lock'||action==='unlock'){
   for(const e of members)e.locked=action==='lock';
  }else if(action==='setLayer'){
   if(!Object.prototype.hasOwnProperty.call(LAYERS,payload.layer))throw Error('Livello CAD non valido');
   for(const e of members)e.layer=payload.layer;
  }else if(action==='linkArticle'){
   if(rows[i].kind!=='symbol')throw Error('Seleziona un simbolo impiantistico');
   const articleId=String(payload.articleId||'');
   if(articleId&&!/^art_[a-zA-Z0-9-]{8,70}$/.test(articleId))throw Error('Codice articolo CAD non valido');
   if(articleId)rows[i].articleId=articleId;else delete rows[i].articleId;
  }else if(action==='replaceSymbol'){
   if(rows[i].kind!=='symbol'||!Object.prototype.hasOwnProperty.call(SYMBOLS,payload.symbol))
    throw Error('Seleziona un simbolo e il suo sostituto');
   if(rows[i].text!==payload.symbol){rows[i].text=payload.symbol;delete rows[i].articleId;}
  }else if(action==='delete')rows.splice(i,1);
  else if(action==='deleteGroup'){
   for(let j=rows.length-1;j>=0;j--)if(memberIds.has(rows[j].id))rows.splice(j,1);
  }else if(action==='duplicate'){
   if(rows.length+members.length>MAX)throw Error('Limite 200 elementi');
   const groupId=members.length>1?uid('g'):undefined;
   const copies=transformMembers(members,(x,y)=>({x:x+20,y:y+20}));
   for(const e of copies){e.id=uid('e');if(groupId)e.groupId=groupId;else delete e.groupId;rows.push(e);}
  }else if(action==='front'||action==='back'){
   const chosen=rows.filter(e=>memberIds.has(e.id)),others=rows.filter(e=>!memberIds.has(e.id));
   rows.splice(0,rows.length,...(action==='front'?[...others,...chosen]:[...chosen,...others]));
  }else if(action==='color'){
   if(!COLORS.includes(payload.color))throw Error('Colore non valido');
   for(const e of members)e.color=payload.color;
  }else if(action==='rotate'){
   const {cx,cy}=bounds(members);
   const raw=members.flatMap(e=>[[e.x,e.y],[e.x2,e.y2]].map(([x,y])=>({x:cx-(y-cy),y:cy+(x-cx)})));
   const minX=Math.min(...raw.map(p=>p.x)),maxX=Math.max(...raw.map(p=>p.x));
   const minY=Math.min(...raw.map(p=>p.y)),maxY=Math.max(...raw.map(p=>p.y));
   if(maxX-minX>W||maxY-minY>H)throw Error('Gruppo troppo grande per ruotare nel foglio');
   const shiftX=minX<0?-minX:maxX>W?W-maxX:0;
   const shiftY=minY<0?-minY:maxY>H?H-maxY:0;
   const changed=transformMembers(members,(x,y)=>({x:cx-(y-cy)+shiftX,y:cy+(x-cx)+shiftY}));
   for(const e of changed)if(e.kind!=='rect')e.rotation=(e.rotation+90)%360;
   for(const e of changed)Object.assign(rows.find(x=>x.id===e.id),e);
  }else if(action==='resize'){
   const factor=payload.factor;
   if(members.length===1&&['symbol','label'].includes(rows[i].kind))throw Error('Ridimensiona la geometria o un gruppo: la dimensione grafica di icone e testi è fissa');
   if(typeof factor!=='number'||!Number.isFinite(factor)||factor<0.5||factor>2||factor===1)
    throw Error('Ridimensionamento consentito dal 50% al 200%, escluso 100%');
   const {cx,cy}=bounds(members);
   const changed=transformMembers(members,(x,y)=>({x:cx+(x-cx)*factor,y:cy+(y-cy)*factor}));
   for(const e of changed)Object.assign(rows.find(x=>x.id===e.id),e);
  }else if(action==='ungroup'){
   if(!rows[i].groupId)throw Error('Elemento non raggruppato');
   for(const e of members)delete e.groupId;
  }else if(action==='move'){
   const dx=payload.dx,dy=payload.dy;
   if(typeof dx!=='number'||typeof dy!=='number'||!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>W||Math.abs(dy)>H)
    throw Error('Spostamento non valido');
   const changed=transformMembers(members,(x,y)=>({x:x+dx,y:y+dy}));
   for(const e of changed)Object.assign(rows.find(x=>x.id===e.id),e);
  }else throw Error('Comando CAD sconosciuto');
 }
 rows.forEach(validateElement);return rows;
}
/* Appunti in memoria dell'editor, mai clipboard di sistema o archivio esterno. */
function copySelection(elements,id){
 if(!Array.isArray(elements)||elements.length>MAX)throw Error('Disegno non valido');
 elements.forEach(validateElement);
 const index=elements.findIndex(e=>e.id===id);
 if(index<0)throw Error('Seleziona un elemento da copiare');
 return copy(geometryMembers(elements,index));
}
function pasteSelection(elements,clipboard,dx=20,dy=20){
 if(!Array.isArray(elements)||!Array.isArray(clipboard)||!clipboard.length||clipboard.length>MAX||
    elements.length+clipboard.length>MAX)throw Error('Appunti vuoti o limite elementi raggiunto');
 elements.forEach(validateElement);clipboard.forEach(validateElement);
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>W||Math.abs(dy)>H)throw Error('Spostamento appunti non valido');
 const originals=new Set(clipboard.map(e=>e.id));
 if(originals.size!==clipboard.length)throw Error('Appunti duplicati');
 const pasted=transformMembers(clipboard,(x,y)=>({x:x+dx,y:y+dy}));
 const groups=new Map(),ids=[];
 for(const e of pasted){
  e.id=uid('e');delete e.locked;ids.push(e.id);
  if(e.groupId){if(!groups.has(e.groupId))groups.set(e.groupId,uid('g'));e.groupId=groups.get(e.groupId);}
 }
 const next=[...copy(elements),...pasted];next.forEach(validateElement);
 return {elements:next,ids};
}
/* Vincolo ortogonale opzionale per muri, linee e quote: nessuna misura inventata. */
function orthogonalPoint(start,end){
 if(!start||!end||![start.x,start.y,end.x,end.y].every(Number.isFinite))throw Error('Punti CAD non validi');
 return Math.abs(end.x-start.x)>=Math.abs(end.y-start.y)?{x:end.x,y:start.y}:{x:start.x,y:end.y};
}

/* Snap CAD avanzato: intersezioni geometriche, punti medi ed estremi.
   Nessuna quota reale viene dedotta. Il punto restituito resta sulla griglia salvabile. */
function segmentIntersection(a,b,c,d){
 const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y;
 const denominator=rx*sy-ry*sx;
 if(Math.abs(denominator)<1e-9)return null; // paralleli / sovrapposti: nessun incrocio univoco
 const qx=c.x-a.x,qy=c.y-a.y;
 const t=(qx*sy-qy*sx)/denominator,u=(qx*ry-qy*rx)/denominator;
 if(t<-1e-9||t>1+1e-9||u<-1e-9||u>1+1e-9)return null;
 return {x:a.x+t*rx,y:a.y+t*ry};
}
function snapSegments(elements){
 const segments=[];
 for(const e of elements){
  if(['wall','line','dimension'].includes(e.kind))segments.push([{x:e.x,y:e.y},{x:e.x2,y:e.y2}]);
  if(e.kind==='rect'&&!e.rotation){
   const a={x:e.x,y:e.y},b={x:e.x2,y:e.y},c={x:e.x2,y:e.y2},d={x:e.x,y:e.y2};
   segments.push([a,b],[b,c],[c,d],[d,a]);
  }
 }
 return segments.filter(([a,b])=>a.x!==b.x||a.y!==b.y);
}
function axisDimensionPoint(start,end,axis){
 if(!start||!end||![start.x,start.y,end.x,end.y].every(Number.isFinite))throw Error('Punti quota non validi');
 if(axis!=='horizontal'&&axis!=='vertical')throw Error('Asse quota non valido');
 return axis==='horizontal'?{x:end.x,y:start.y}:{x:start.x,y:end.y};
}
function snapPoint(p,elements,enabled=true,radius=18,advanced=false){
 if(!Array.isArray(elements)||elements.length>MAX||typeof radius!=='number'||!Number.isFinite(radius)||radius<0||radius>50)throw Error('Aggancio CAD non valido');
 const q=point(p.x,p.y);if(!enabled)return q;
 let best=radius+1,match=null;
 const consider=candidate=>{const target=point(candidate.x,candidate.y),distance=Math.hypot(q.x-candidate.x,q.y-candidate.y);
  if(distance<best){best=distance;match=target}};
 for(const e of elements){validateElement(e);const ends=e.kind==='symbol'||e.kind==='label'?[{x:e.x,y:e.y}]:[{x:e.x,y:e.y},{x:e.x2,y:e.y2}];
  for(const end of ends)consider(end);
 }
 if(advanced){
  const segments=snapSegments(elements);
  for(const [a,b] of segments)consider({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  // Calcola incroci solo tra segmenti vicini al cursore: niente scansione quadratica su tutto il foglio.
  const nearby=segments.filter(([a,b])=>q.x>=Math.min(a.x,b.x)-radius&&q.x<=Math.max(a.x,b.x)+radius&&q.y>=Math.min(a.y,b.y)-radius&&q.y<=Math.max(a.y,b.y)+radius);
  for(let i=0;i<nearby.length;i++)for(let j=i+1;j<nearby.length;j++){
   const cross=segmentIntersection(...nearby[i],...nearby[j]);if(cross)consider(cross);
  }
 }
 return best<=radius?match:q;
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

/* Distinta collegata al catalogo: sola lettura, non scarica la giacenza e non crea preventivi. */
function catalogSchedule(elements,scale,articles=[],movements=[]){
 const geometry=materialSchedule(elements,scale);
 if(!Array.isArray(articles)||!Array.isArray(movements))throw Error('Catalogo CAD non valido');
 const ids=new Set();for(const a of articles){if(!a||typeof a.id!=='string'||ids.has(a.id))throw Error('Catalogo CAD non valido');ids.add(a.id)}
 const groups=new Map();
 for(const e of elements){if(e.kind!=='symbol')continue;
  const key=e.text+'|'+(e.articleId||'');
  if(!groups.has(key))groups.set(key,{symbol:e.text,articleId:e.articleId||'',count:0});
  groups.get(key).count++;
 }
 const items=[...groups.values()].sort((a,b)=>(a.symbol+'|'+a.articleId).localeCompare(b.symbol+'|'+b.articleId)).map(row=>{
  const article=articles.find(a=>a.id===row.articleId&&a.kind==='Materiale');
  const unit=String(article?.unit||'').trim();
  const compatible=/^(pz|pza|pezzo|pezzi)$/i.test(unit);
  const price=typeof article?.price==='number'&&Number.isFinite(article.price)&&article.price>=0?article.price:null;
  const related=movements.filter(m=>m.articleId===row.articleId);
  let stock=0;
  for(const m of related){const q=typeof m.quantity==='number'?m.quantity:typeof m.quantity==='string'&&m.quantity.trim()?Number(m.quantity):NaN;if(!Number.isFinite(q)){stock=null;break}stock+=q}
  const valid=!!article&&compatible;
  const warning=!article?'Articolo non associato o non più presente':!compatible?'Unità non compatibile con il conteggio pezzi':stock===null?'Giacenza non verificabile':stock<row.count?'Giacenza inferiore ai simboli (nessuna prenotazione)':price===null?'Prezzo archivio mancante':'';
  return {...row,label:SYMBOLS[row.symbol],articleCode:String(article?.code||''),description:String(article?.description||''),unit,price:valid?price:null,priceRole:String(article?.priceRole||'non specificato'),stock:valid?stock:null,shortage:valid&&stock!==null?Math.max(0,row.count-stock):null,estimated:valid&&price!==null?Math.round(row.count*price*100)/100:null,warning};
 });
 const allPriced=items.length>0&&items.every(x=>x.estimated!==null);
 return {items,wallMeters:geometry.wallMeters,lineMeters:geometry.lineMeters,calibrated:geometry.calibrated,allPriced,archiveTotal:allPriced?Math.round(items.reduce((n,x)=>n+x.estimated,0)*100)/100:null};
}

/* Registro dei livelli: conteggi e lunghezze indicativi, anche per elementi nascosti nell'editor. */
function layerReport(elements,scale=null){
 if(!Array.isArray(elements)||elements.length>MAX||!validScale(scale))throw Error('Registro livelli CAD non valido');
 const report=Object.keys(LAYERS).map(id=>({id,label:LAYERS[id],count:0,locked:0,walls:0,lines:0,symbols:0,wallMeters:null,lineMeters:null}));
 for(const e of elements){
  validateElement(e);
  const row=report.find(r=>r.id===layerOf(e));row.count++;
  if(e.locked)row.locked++;
  if(e.kind==='symbol')row.symbols++;
  if(e.kind==='wall')row.walls+=Math.hypot(e.x2-e.x,e.y2-e.y);
  if(e.kind==='line')row.lines+=Math.hypot(e.x2-e.x,e.y2-e.y);
 }
 for(const row of report){
  row.wallMeters=scale==null?null:Math.round(row.walls*scale)/100;
  row.lineMeters=scale==null?null:Math.round(row.lines*scale)/100;
  delete row.walls;delete row.lines;
 }
 return report;
}

/* Milestone 44: rilievo metrico di contorni chiusi, senza dedurre quote non rilevate.
   Le misure sono indicative e non costituiscono computo metrico certificato. */
function roomMeasurements(elements,scale=null){
 if(!Array.isArray(elements)||elements.length>MAX||!validScale(scale))throw Error('Rilievo CAD non valido');
 const walls=elements.filter(e=>{validateElement(e);return e.kind==='wall'});
 const rectangles=elements.filter(e=>e.kind==='rect');
 const contours=[];
 const factor=scale==null?null:scale/100;
 for(const e of rectangles){
  const width=Math.abs(e.x2-e.x),height=Math.abs(e.y2-e.y);
  if(width===0||height===0)continue;
  contours.push({type:'rettangolo',ids:[e.id],closed:true,perimeterUnits:2*(width+height),areaUnits:width*height});
 }
 const used=new Set();
 for(const first of walls){
  if(used.has(first.id))continue;
  const component=[],stack=[first],seen=new Set();
  while(stack.length){
   const e=stack.pop();if(seen.has(e.id))continue;
   seen.add(e.id);component.push(e);
   const endpoints=[e.x+','+e.y,e.x2+','+e.y2];
   for(const other of walls){
    if(seen.has(other.id))continue;
    if(endpoints.includes(other.x+','+other.y)||endpoints.includes(other.x2+','+other.y2))stack.push(other);
   }
  }
  component.forEach(e=>used.add(e.id));
  const degrees=new Map();
  for(const e of component)for(const key of [e.x+','+e.y,e.x2+','+e.y2])degrees.set(key,(degrees.get(key)||0)+1);
  const closed=component.length>=3&&[...degrees.values()].every(v=>v===2);
  const perimeterUnits=component.reduce((n,e)=>n+Math.hypot(e.x2-e.x,e.y2-e.y),0);
  let areaUnits=null;
  if(closed){
   const adjacency=new Map();
   for(const e of component){
    const a=e.x+','+e.y,b=e.x2+','+e.y2;
    if(!adjacency.has(a))adjacency.set(a,[]);
    if(!adjacency.has(b))adjacency.set(b,[]);
    adjacency.get(a).push(b);adjacency.get(b).push(a);
   }
   const start=[...adjacency.keys()].sort()[0],vertices=[start];
   let previous=null,current=start;
   for(let i=0;i<component.length;i++){
    const next=adjacency.get(current).find(v=>v!==previous);
    if(!next)break;
    vertices.push(next);previous=current;current=next;
   }
   if(vertices.length===component.length+1&&vertices.at(-1)===start){
    let sum=0;
    for(let i=0;i<vertices.length-1;i++){
     const [x,y]=vertices[i].split(',').map(Number),[xx,yy]=vertices[i+1].split(',').map(Number);
     sum+=x*yy-xx*y;
    }
    areaUnits=Math.abs(sum)/2;
   }
  }
  contours.push({type:'muri',ids:component.map(e=>e.id),closed:areaUnits!==null,perimeterUnits,areaUnits});
 }
 return {calibrated:factor!==null,contours:contours.map(c=>({...c,
  perimeterMeters:factor===null?null:Math.round(c.perimeterUnits*factor*1000)/1000,
  areaSquareMeters:factor===null||c.areaUnits===null?null:Math.round(c.areaUnits*factor*factor*1000)/1000
 })),openContours:contours.filter(c=>!c.closed).length};
}

function references(rows,kind,id){
 const fields={clienti:'clientId',immobili:'propertyId',cantieri:'siteId',impianti:'plantId'};
 return (rows||[]).some(r=>fields[kind]&&same(r[fields[kind]],id));
}
function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
function svgElement(tag,attrs,text){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n}
function renderSvg(elements,selected='',draft=true,scale=null,hiddenLayers=new Set()){
 if(!validScale(scale))throw Error('Scala CAD non valida');const chosen=new Set(Array.isArray(selected)?selected:[selected]);
 const svg=svgElement('svg',{xmlns:NS,viewBox:'0 0 '+W+' '+H,width:W,height:H,role:'img','aria-label':'Disegno tecnico CAD in bozza'});
 svg.append(svgElement('rect',{x:0,y:0,width:W,height:H,fill:'#ffffff'}));
 for(let x=0;x<=W;x+=50)svg.append(svgElement('line',{x1:x,y1:0,x2:x,y2:H,stroke:'#e5eaf0','stroke-width':1}));
 for(let y=0;y<=H;y+=50)svg.append(svgElement('line',{x1:0,y1:y,x2:W,y2:y,stroke:'#e5eaf0','stroke-width':1}));
 for(const e of elements){
  if(hiddenLayers.has(layerOf(e)))continue;
  const group=svgElement('g',{'data-cad-id':e.id,'data-cad-layer':layerOf(e),tabindex:'0',role:'button','aria-label':e.kind+' '+e.id+(e.locked?' bloccato':'')});
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
 const state={current:null,elements:[],selected:'',selectedIds:[],clipboard:[],multi:false,snap:true,advancedSnap:false,orthogonal:true,hiddenLayers:new Set(),scale:null,tool:'select',start:null,drag:null,undo:[],redo:[],dirty:false,saving:false};
 const h=el('h2','Disegno tecnico I.T.E. CAD — bozza vettoriale'),note=el('p','Strumenti per muri, linee, rettangoli, simboli impiantistici, quote, gruppi e distinta indicativa. La scala in cm è inserita dal tecnico e deve essere verificata sul posto. Ogni salvataggio crea un backup preventivo e una revisione.','hint');
 host.append(h,note);
 const selectors=el('div');selectors.className='grid';
 const mkSelect=(title)=>{const l=el('label',title),s=el('select');l.append(s);selectors.append(l);return s};
 const client=mkSelect('Cliente'),property=mkSelect('Sede / immobile'),site=mkSelect('Cantiere'),plant=mkSelect('Impianto');
 const title=el('input');title.maxLength=120;title.placeholder='Titolo del disegno';const titleLabel=el('label','Titolo del disegno');titleLabel.append(title);selectors.append(titleLabel);host.append(selectors);
 const options=el('div');options.className='actions';host.append(options);
 const scaleLabel=el('label','Scala di lavoro (cm per unità grafica)'),scaleInput=el('input');scaleInput.type='number';scaleInput.min='0.01';scaleInput.max='100';scaleInput.step='0.01';scaleInput.placeholder='Non calibrata';scaleLabel.append(scaleInput);options.append(scaleLabel);
 const symbolLabel=el('label','Simbolo impiantistico'),symbolSelect=el('select');for(const [code,label] of Object.entries(SYMBOLS))symbolSelect.append(new Option(label,code));symbolLabel.append(symbolSelect);options.append(symbolLabel);
 const layerLabel=el('label','Livello CAD attivo'),layerSelect=el('select');for(const [id,name] of Object.entries(LAYERS))layerSelect.append(new Option(name,id));layerLabel.append(layerSelect);options.append(layerLabel);
 const articleLabel=el('label','Articolo di magazzino associato al simbolo selezionato'),articleSelect=el('select');articleLabel.append(articleSelect);options.append(articleLabel);
 const list=mkSelect('Disegni salvati (seleziona per aprire)');host.append(list.parentElement);
 const toolbar=el('div');toolbar.className='actions';host.append(toolbar);
 const status=el('p','','hint');status.setAttribute('role','status');host.append(status);
 const canvas=el('div');canvas.style.cssText='overflow:auto;touch-action:pan-x pan-y;border:1px solid #b5c6d7;background:white;max-width:100%';host.append(canvas);
 const commands=el('div');commands.className='actions';host.append(commands);
 const scheduleBox=el('div');scheduleBox.setAttribute('aria-label','Distinta materiali indicativa');host.append(scheduleBox);
 const layersBox=el('div');layersBox.setAttribute('aria-label','Riepilogo livelli CAD');host.append(layersBox);
 const measuresBox=el('div');measuresBox.setAttribute('aria-label','Rilievo metrico dei contorni');host.append(measuresBox);
 const say=s=>{status.textContent=s};
 const button=(where,label,fn)=>{const b=el('button',label);b.type='button';b.addEventListener('click',fn);where.append(b);return b};
 const option=(s,value,label)=>s.append(new Option(label,value));
 const fill=(s,rows,placeholder)=>{const old=s.value;s.replaceChildren();option(s,'',placeholder);for(const r of rows)option(s,String(r.id),String(r.name||r.title||r.address||'#'+r.id));s.value=rows.some(r=>same(r.id,old))?old:''};
 const database=()=>root.ITE.snapshot();
 function cascade(){const db=database();fill(property,(db.immobili||[]).filter(r=>same(r.client_id,client.value)),'— Sede facoltativa —');fill(site,(db.cantieri||[]).filter(r=>same(r.client_id,client.value)),'— Cantiere facoltativo —');fill(plant,(db.impianti||[]).filter(r=>same(r.immobile_id,property.value)),'— Impianto facoltativo —')}
 function refreshCatalog(){const old=articleSelect.value;articleSelect.replaceChildren(new Option('— Nessun articolo associato —',''));for(const a of root.ITECommerce.snapshot().articles.filter(a=>a.kind==='Materiale'))articleSelect.append(new Option([a.code,a.description,a.unit].filter(Boolean).join(' · ').slice(0,180),a.id));articleSelect.value=[...articleSelect.options].some(o=>o.value===old)?old:''}
 function refreshChoices(){const db=database();fill(client,db.clienti||[],'— Seleziona cliente —');cascade();const drawings=root.ITECommerce.snapshot().settings.cadDrawings||[];fill(list,drawings.filter(r=>!r.archived),'— Nuovo disegno —');refreshCatalog()}
 client.addEventListener('change',()=>{state.clipboard=[];cascade()});property.addEventListener('change',()=>{const db=database();fill(plant,(db.impianti||[]).filter(r=>same(r.immobile_id,property.value)),'— Impianto facoltativo —')});
 function snapshot(){state.undo.push({elements:copy(state.elements),scale:state.scale});if(state.undo.length>60)state.undo.shift();state.redo.length=0}
 function update(next){snapshot();state.elements=next;state.dirty=true;paint()}
 function paint(){
  const svg=renderSvg(state.elements,state.selectedIds.length?state.selectedIds:state.selected,true,state.scale,state.hiddenLayers);
  svg.style.cssText='width:100%;height:auto;min-width:450px;touch-action:none';canvas.replaceChildren(svg);
  svg.addEventListener('pointerdown',down);svg.addEventListener('pointerup',up);
  svg.addEventListener('pointercancel',()=>{state.start=null;state.drag=null});svg.addEventListener('pointermove',move);
  const summary=catalogSchedule(state.elements,state.scale,root.ITECommerce.snapshot().articles,root.ITECommerce.snapshot().movements);scheduleBox.replaceChildren(el('h3','Distinta CAD e catalogo — bozza, non è un ordine né uno scarico'));
  const chosen=state.elements.find(e=>e.id===state.selected);articleSelect.value=chosen?.kind==='symbol'&&[...articleSelect.options].some(o=>o.value===chosen.articleId)?chosen.articleId:'';
  for(const item of summary.items){const info=item.articleCode?' · '+item.articleCode+' · '+item.description:' · senza articolo';const stock=item.stock===null?' · giacenza non verificata':' · giacenza attuale '+item.stock+' '+item.unit;const cost=item.estimated===null?' · prezzo da verificare':' · valore archivio '+item.estimated.toFixed(2)+' € ('+item.priceRole+')';scheduleBox.append(el('p',item.label+' × '+item.count+info+stock+cost+(item.warning?' · ATTENZIONE: '+item.warning:'')))}
  scheduleBox.append(el('p',summary.calibrated?'Muri: '+summary.wallMeters+' m · Linee: '+summary.lineMeters+' m (indicativi)':'Lunghezze non disponibili: calibrare la scala'));
  scheduleBox.append(el('p',summary.allPriced?'Somma prezzi archivio '+summary.archiveTotal.toFixed(2)+' € — non è un prezzo di vendita né un preventivo. Posa esclusa.':'Prezzi non completi: nessun totale economico. Fornitura e posa da quantificare separatamente.'));
  measuresBox.replaceChildren(el('h3','Rilievo metrico indicativo — contorni chiusi'));
  const measures=roomMeasurements(state.elements,state.scale);
  for(const c of measures.contours)measuresBox.append(el('p',c.type+' · '+(c.closed?'chiuso':'APERTO / DA VERIFICARE')+' · '+(c.perimeterMeters===null?'scala non calibrata':c.perimeterMeters+' m perimetro')+' · '+(c.areaSquareMeters===null?'superficie non calcolabile':c.areaSquareMeters+' m²')));
  if(measures.openContours)measuresBox.append(el('p','Attenzione: '+measures.openContours+' contorni aperti o ramificati. Verificare la geometria prima di utilizzare le misure.'));
  layersBox.replaceChildren(el('h3','Livelli del disegno — visibilità solo editor'));
  for(const layer of layerReport(state.elements,state.scale).filter(r=>r.count))layersBox.append(el('p',layer.label+': '+layer.count+' elementi ('+layer.locked+' bloccati, '+layer.symbols+' simboli)'+(state.hiddenLayers.has(layer.id)?' · NASCOSTO SOLO NELL’EDITOR':'')));
  say(state.elements.length+' elementi · '+(state.dirty?'Modifiche da salvare':'Salvato / nuova bozza')+' · strumento '+state.tool+(state.multi?' · selezione multipla':''));
 }
 const coord=e=>{const svg=canvas.querySelector('svg'),r=svg.getBoundingClientRect();return snapPoint(point((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height),state.elements.filter(x=>!state.hiddenLayers.has(layerOf(x))),state.snap&&state.tool!=='select',18,state.advancedSnap)};
 function down(e){if(e.button!==0)return;const p=coord(e),target=e.target.closest('[data-cad-id]'),id=target?.getAttribute('data-cad-id')||'';
  if(state.multi){if(id){state.selectedIds=state.selectedIds.includes(id)?state.selectedIds.filter(x=>x!==id):[...state.selectedIds,id];state.selected=id}state.start=null;paintSelection();return}
  state.selectedIds=[];state.selected=id;state.start=p;state.drag=state.tool==='select'&&state.selected?p:null;e.currentTarget.setPointerCapture?.(e.pointerId);paintSelection()}
 function paintSelection(){for(const node of canvas.querySelectorAll('[data-cad-id]'))node.style.opacity=(state.selectedIds.length?state.selectedIds.includes(node.getAttribute('data-cad-id')):node.getAttribute('data-cad-id')===state.selected)?'1':state.multi?'0.35':'0.9';const selected=state.elements.find(e=>e.id===state.selected);articleSelect.value=selected?.kind==='symbol'&&[...articleSelect.options].some(o=>o.value===selected.articleId)?selected.articleId:''}
 function move(e){if(!state.start)return;const raw=coord(e),p=state.tool==='dimension-h'?axisDimensionPoint(state.start,raw,'horizontal'):state.tool==='dimension-v'?axisDimensionPoint(state.start,raw,'vertical'):state.orthogonal&&['wall','line','dimension'].includes(state.tool)?orthogonalPoint(state.start,raw):raw;status.textContent='Da ('+state.start.x+','+state.start.y+') a ('+p.x+','+p.y+') · '+Math.round(Math.hypot(p.x-state.start.x,p.y-state.start.y))+' unità grafiche'+(state.scale!=null?' · '+(Math.round(Math.hypot(p.x-state.start.x,p.y-state.start.y)*state.scale*10)/10)+' cm indicativi':'')+(state.orthogonal?' · ortogonale':'')}
 function up(e){if(!state.start)return;const raw=coord(e),start=state.start,p=state.tool==='dimension-h'?axisDimensionPoint(start,raw,'horizontal'):state.tool==='dimension-v'?axisDimensionPoint(start,raw,'vertical'):state.orthogonal&&['wall','line','dimension'].includes(state.tool)?orthogonalPoint(start,raw):raw;state.start=null;
  try{if(state.tool==='select'){if(state.drag&&state.selected&&(p.x!==start.x||p.y!==start.y))update(operate(state.elements,'move',state.selected,{dx:p.x-start.x,dy:p.y-start.y}));else paint();state.drag=null;return}
   const text=state.tool==='symbol'?symbolSelect.value:state.tool==='label'?root.prompt('Testo etichetta (max 120 caratteri)','')||'':['dimension','dimension-h','dimension-v'].includes(state.tool)?root.prompt('Quota (facoltativa; verificare sul posto)','')||'':'';
   const element=make(['dimension-h','dimension-v'].includes(state.tool)?'dimension':state.tool,start,state.tool==='symbol'?start:p,text);element.layer=layerSelect.value;update(operate(state.elements,'add','',{element}));state.selected=element.id;
  }catch(err){say(err.message)}
 }
 for(const [key,label] of [['select','Seleziona / sposta'],['wall','Muro'],['line','Linea'],['rect','Rettangolo'],['dimension','Quota'],['dimension-h','Quota orizzontale'],['dimension-v','Quota verticale'],['label','Testo'],['symbol','Simbolo']])button(toolbar,label,()=>{state.tool=key;state.start=null;state.multi=false;state.selectedIds=[];multiButton.textContent='Selezione multipla: OFF';paint();say('Strumento: '+label)});
 const action=(label,fn)=>button(commands,label,()=>{try{fn()}catch(err){say(err.message)}});
 action('Aggiorna catalogo materiali',()=>{refreshCatalog();paint();say('Catalogo aggiornato senza modificare il disegno')});
 action('Associa articolo al simbolo',()=>{const selected=state.elements.find(e=>e.id===state.selected);if(!selected||selected.kind!=='symbol')throw Error('Seleziona prima un simbolo');const articleId=articleSelect.value;const articles=root.ITECommerce.snapshot().articles;if(articleId&&!articles.some(a=>a.id===articleId&&a.kind==='Materiale'))throw Error('Articolo non valido o non più presente');update(operate(state.elements,'linkArticle',selected.id,{articleId}))});
 const multiButton=button(toolbar,'Selezione multipla: OFF',function(){state.multi=!state.multi;state.tool='select';state.selectedIds=[];this.textContent='Selezione multipla: '+(state.multi?'ON':'OFF');paint()});
 button(toolbar,'Aggancio estremi: ON',function(){state.snap=!state.snap;this.textContent='Aggancio estremi: '+(state.snap?'ON':'OFF');paint()});
 button(toolbar,'Snap geometrico avanzato: OFF',function(){state.advancedSnap=!state.advancedSnap;this.textContent='Snap geometrico avanzato: '+(state.advancedSnap?'ON':'OFF');paint()});
 button(toolbar,'Vincolo ortogonale: ON',function(){state.orthogonal=!state.orthogonal;this.textContent='Vincolo ortogonale: '+(state.orthogonal?'ON':'OFF');paint()});
 action('Assegna livello alla selezione',()=>{if(!state.selected)throw Error('Seleziona prima un elemento');update(operate(state.elements,'setLayer',state.selected,{layer:layerSelect.value}));});
 action('Blocca selezione',()=>{if(!state.selected)throw Error('Seleziona prima un elemento');update(operate(state.elements,'lock',state.selected));});
 action('Sblocca selezione',()=>{if(!state.selected)throw Error('Seleziona prima un elemento');update(operate(state.elements,'unlock',state.selected));});
 action('Mostra / nascondi livello attivo',()=>{const id=layerSelect.value;if(state.hiddenLayers.has(id))state.hiddenLayers.delete(id);else state.hiddenLayers.add(id);state.selected='';state.selectedIds=[];paint();say(LAYERS[id]+(state.hiddenLayers.has(id)?' nascosto':' visibile')+' solo nell’editor; il disegno salvato e le esportazioni restano completi');});
 action('Mostra tutti i livelli',()=>{state.hiddenLayers.clear();paint()});
 action('Raggruppa selezionati',()=>{const next=operate(state.elements,'group','',{ids:state.selectedIds});update(next);state.selectedIds=[];state.multi=false;multiButton.textContent='Selezione multipla: OFF';paint()});
 action('Separa gruppo',()=>update(operate(state.elements,'ungroup',state.selected)));
 action('Sostituisci simbolo selezionato',()=>update(operate(state.elements,'replaceSymbol',state.selected,{symbol:symbolSelect.value})));
 action('Elimina gruppo intero',()=>{if(!state.selected)throw Error('Seleziona un gruppo o elemento');if(!root.confirm('Eliminare gli elementi del gruppo dalla bozza? Puoi usare Annulla.'))return;update(operate(state.elements,'deleteGroup',state.selected));state.selected='';state.selectedIds=[];});
 action('Ridimensiona selezione (%)',()=>{if(!state.selected)throw Error('Seleziona un elemento o gruppo');const value=root.prompt('Scala geometria 50–200% (le icone mantengono dimensione grafica)','150');if(value===null)return;const factor=Number(String(value).replace(',','.'))/100;update(operate(state.elements,'resize',state.selected,{factor}));});
 action('Copia gruppo / elemento (memoria locale)',()=>{state.clipboard=copySelection(state.elements,state.selected);say(state.clipboard.length+' elementi copiati soltanto in questa bozza CAD');});
 action('Incolla copia (+20 unità)',()=>{const result=pasteSelection(state.elements,state.clipboard);update(result.elements);state.selectedIds=result.ids;state.selected=result.ids[0]||'';paint();});
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
 for(const [label,kind] of [['Duplica gruppo / elemento','duplicate'],['Ruota gruppo / elemento 90°','rotate'],['Porta gruppo avanti','front'],['Porta gruppo indietro','back'],['Elimina elemento','delete']])action(label,()=>update(operate(state.elements,kind,state.selected)));
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

 action('Esporta riepilogo livelli CSV (bozza)',()=>{
  const quote=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const lines=[['Livello','Elementi','Bloccati','Simboli','Muri (m)','Linee (m)','Avviso'].map(quote).join(';')];
  for(const row of layerReport(state.elements,state.scale))if(row.count)lines.push([row.label,row.count,row.locked,row.symbols,row.wallMeters??'',row.lineMeters??'','BOZZA, verificare le quote sul posto'].map(quote).join(';'));
  download('\uFEFF'+lines.join('\r\n'),'ITE-CAD-livelli-bozza.csv','text/csv;charset=utf-8');
 });
 action('Esporta distinta catalogo CSV (bozza)',()=>{
  const summary=catalogSchedule(state.elements,state.scale,root.ITECommerce.snapshot().articles,root.ITECommerce.snapshot().movements);
  const csvRow=fields=>fields.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';');
  const lines=[csvRow(['Simbolo','Articolo','Descrizione','Quantità simboli','Unità catalogo','Prezzo archivio','Ruolo prezzo','Valore archivio','Giacenza attuale','Fabbisogno non coperto','Avvertenze','Posa'])];
  for(const i of summary.items)lines.push(csvRow([i.label,i.articleCode,i.description,i.count,i.unit,i.price,i.priceRole,i.estimated,i.stock,i.shortage,i.warning,'DA QUANTIFICARE SEPARATAMENTE']));
  lines.push(csvRow(['NOTA','Bozza CAD, non è ordine, preventivo o movimento di magazzino. Verificare quantità, prezzi, unità e posa.']));
  download('\uFEFF'+lines.join('\r\n'),'ITE-CAD-catalogo-bozza.csv','text/csv;charset=utf-8');
 });
 action('Esporta tavola A4 HTML (bozza)',()=>{
  const summary=catalogSchedule(state.elements,state.scale,root.ITECommerce.snapshot().articles,root.ITECommerce.snapshot().movements),db=database();
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const name=db.clienti.find(x=>same(x.id,client.value))?.name||'Non indicato';
  const address=db.immobili.find(x=>same(x.id,property.value))?.address||'Non indicata';
  const drawing=new XMLSerializer().serializeToString(renderSvg(state.elements,'',true,state.scale));
  const rows=summary.items.map(i=>'<tr><td>'+safe(i.label)+'</td><td>'+safe(i.articleCode)+'</td><td>'+safe(i.description)+'</td><td>'+i.count+'</td><td>'+safe(i.unit)+'</td><td>'+safe(i.warning||'Da verificare sul posto')+'</td></tr>').join('');
  const html='<!doctype html><html lang="it"><head><meta charset="utf-8"><title>ITE CAD - BOZZA</title><style>@page{size:A4 landscape;margin:12mm}body{font:12px Arial,sans-serif;color:#173451}h1{font-size:20px}p{margin:5px 0}.draft{color:#a02020;font-weight:bold}svg{width:100%;height:auto;max-height:135mm}table{border-collapse:collapse;width:100%;font-size:10px}td,th{border:1px solid #999;padding:4px;text-align:left}tr{break-inside:avoid}footer{margin-top:8px;border-top:1px solid #999}</style></head><body><h1>I.T.E. — Tavola tecnica CAD</h1><p class="draft">BOZZA NON CERTIFICATA — QUOTE E MATERIALI DA VERIFICARE</p><p>Disegno: '+safe(title.value)+' · Cliente: '+safe(name)+' · Sede: '+safe(address)+'</p><p>Scala di lavoro: '+safe(state.scale==null?'Non calibrata':state.scale+' cm per unità grafica')+'</p>'+drawing+'<h2>Distinta preliminare</h2><table><thead><tr><th>Simbolo</th><th>Codice</th><th>Articolo</th><th>Quantità</th><th>U.M.</th><th>Note</th></tr></thead><tbody>'+rows+'</tbody></table><footer>Fornitura e posa da quantificare separatamente. Nessun prelievo di magazzino, nessuna attestazione di conformità. Esportazione locale non cifrata.</footer></body></html>';
  download(html,'ITE-CAD-tavola-A4-bozza.html','text/html;charset=utf-8');
 });
 const upload=el('input');upload.type='file';upload.accept='.json,application/json';const uploadLabel=el('label','Importa disegno JSON in bozza');uploadLabel.append(upload);host.append(uploadLabel);
 upload.addEventListener('change',async()=>{try{const f=upload.files[0];if(!f)return;if(f.size>250000)throw Error('File CAD troppo grande');const data=JSON.parse(await f.text());if(data.format!=='ITE-CAD-DRAFT'||![1,2].includes(data.schema)||!validScale(data.scaleCmPerUnit)||!Array.isArray(data.elements)||data.elements.length>MAX)throw Error('Formato CAD non valido');const ids=new Set();for(const e of data.elements){validateElement(e);if(ids.has(e.id))throw Error('Elementi duplicati');ids.add(e.id)}update(copy(data.elements));state.scale=data.scaleCmPerUnit??null;scaleInput.value=state.scale==null?'':String(state.scale);title.value=safeText(data.title)||title.value;paint();say('Bozza importata: verifica cliente e sede prima di salvare.')}catch(err){say(err.message)}finally{upload.value=''}});
 async function save(archived=false){
  if(state.saving)throw Error('Salvataggio CAD già in corso');state.saving=true;
  try{
  if(!root.ITEVault?.isUnlocked?.())throw Error('Archivio cifrato bloccato');
  const db=database(),old=root.ITECommerce.snapshot().settings.cadDrawings||[],previous=old.find(x=>same(x.id,state.current));
  const record={id:previous?.id||uid('cad'),title:safeText(title.value),clientId:client.value,propertyId:property.value,siteId:site.value,plantId:plant.value,updated:new Date().toISOString(),archived,revision:(previous?.revision||0)+1,scaleCmPerUnit:state.scale,elements:copy(state.elements),history:previous?[...previous.history,{revision:previous.revision,at:previous.updated,scaleCmPerUnit:previous.scaleCmPerUnit??null,elements:copy(previous.elements)}].slice(-30):[]};
  if(!record.title)throw Error('Indica il titolo');validateCollection([record],db,root.ITECommerce.snapshot().articles);
  if(root.ITEBackup?.busy?.())throw Error('Backup già in corso');
  await root.ITEHistory.create('Prima modifica CAD '+record.title);
  await root.ITECommerce.mutate(next=>{const rows=next.settings.cadDrawings||[];const index=rows.findIndex(r=>same(r.id,record.id));if(previous&&index<0)throw Error('Disegno modificato da altra sessione');if(index>=0){if(rows[index].revision!==previous.revision)throw Error('Revisione CAD cambiata: riapri il disegno');rows[index]=record}else rows.push(record);next.settings.cadDrawings=rows});
  state.current=record.id;state.dirty=false;state.undo=[];state.redo=[];refreshChoices();list.value=record.id;paint();say('Disegno '+(archived?'archiviato':'salvato')+' con backup preventivo · revisione '+record.revision);
  }finally{state.saving=false}
 }
 button(commands,'Salva con backup e revisione',()=>save().catch(e=>say(e.message)));
 button(commands,'Archivia (non elimina)',()=>{if(!state.current)return say('Apri un disegno salvato');if(root.confirm('Archiviare il disegno conservando lo storico?'))save(true).catch(e=>say(e.message))});
 button(commands,'Nuovo',()=>{if(state.dirty&&!root.confirm('Abbandonare le modifiche non salvate?'))return;state.current=null;state.elements=[];state.selected='';state.selectedIds=[];state.clipboard=[];state.hiddenLayers.clear();layerSelect.value='arch';state.scale=null;scaleInput.value='';state.undo=[];state.redo=[];state.dirty=false;title.value='';list.value='';paint()});
 list.addEventListener('change',()=>{if(!list.value)return;if(state.dirty&&!root.confirm('Abbandonare le modifiche non salvate?'))return;const record=(root.ITECommerce.snapshot().settings.cadDrawings||[]).find(r=>same(r.id,list.value));if(!record)return;state.current=record.id;state.elements=copy(record.elements);state.clipboard=[];state.hiddenLayers.clear();layerSelect.value='arch';state.scale=record.scaleCmPerUnit??null;scaleInput.value=state.scale==null?'':String(state.scale);state.undo=[];state.redo=[];state.selected='';state.selectedIds=[];state.dirty=false;title.value=record.title;client.value=record.clientId;cascade();property.value=record.propertyId;site.value=record.siteId;const db=database();fill(plant,(db.impianti||[]).filter(r=>same(r.immobile_id,property.value)),'— Impianto facoltativo —');plant.value=record.plantId;paint()});
 refreshChoices();paint();
 root.addEventListener('beforeunload',event=>{if(state.dirty){event.preventDefault();event.returnValue='';}});
}
const api=Object.freeze({KINDS,COLORS,SYMBOLS,LAYERS,layerOf,layerReport,roomMeasurements,validScale,snapPoint,segmentIntersection,axisDimensionPoint,materialSchedule,catalogSchedule,validateElement,validateCollection,make,operate,copySelection,pasteSelection,orthogonalPoint,references,renderSvg,mount});
root.ITECad=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined')root.addEventListener('ite-vault-ready',mount);
})(typeof globalThis!=='undefined'?globalThis:this);
