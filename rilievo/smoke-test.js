// Node.js smoke test, no external dependencies. Run: node rilievo/smoke-test.js
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),js=html.split('<script>')[1].split('</script>')[0];
class El{constructor(){this.children=[];this.value='';this.style={};this.dataset={};this.classList={toggle(){},add(){},remove(){}};this.selectedOptions=[{text:'Preventivo'}];this.attrs={};this.innerHTML='';}
appendChild(e){this.children.push(e);return e}append(...es){this.children.push(...es)}replaceChildren(...es){this.children=[...es]}setAttribute(k,v){this.attrs[k]=v}addEventListener(){}setPointerCapture(){}}
const all=new Map(),el=id=>{if(!all.has(id))all.set(id,new El);return all.get(id)};
const document={getElementById:el,createElement:()=>new El,createElementNS:()=>new El,querySelectorAll:()=>[],body:new El};
Object.entries({routeKind:'AF',routeMaterial:'Multistrato',diameter:'16 mm',elevation:'0',roomKind:'Bagno',roomW:'320',roomH:'280',roomName:'Bagno',projectName:'Prova',phase:'preventivo',dxfUnit:'mm',imageWidth:'850',itemType:'bidet',voiceText:''}).forEach(([id,v])=>el(id).value=v);
const store=new Map(),localStorage={setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k)||null};
const box={document,window:{},localStorage,console,setTimeout,clearTimeout,Math,Date,JSON,Blob,URL,confirm:()=>true};
vm.createContext(box);vm.runInContext(js,box);
const api=box.window.iteDebug;
api.demo();let p=api.getProject();assert.equal(p.rooms.length,2);assert.equal(p.items.length,7);assert.equal(p.routes.length,3);
assert.equal(Math.round(api.bill().find(x=>x.name==='Multistrato').qty*100),140);
assert.match(api.dxf(),/IMPIANTO_AF/);
api.voiceCommand('aggiungi bidet');assert.equal(api.getProject().items.length,8);
api.voiceCommand('collega collettore bidet acqua fredda');assert.equal(api.getProject().routes.length,4);
const dxf=['0','SECTION','2','ENTITIES','0','LINE','10','0','20','0','11','1000','21','0','0','ENDSEC','0','EOF'].join('\n');
api.importDXF(dxf);assert.equal(api.getProject().cadLines.length,1);
el('snapshot').onclick();assert.equal(api.getProject().revisions.length,1);
api.voiceCommand('aggiungi lavabo');el('revisions').value='0';el('restoreRevision').onclick();assert.equal(api.getProject().items.length,8);
const pts=vm.runInContext('orthogonalize([[10,10],[19,16],[30,25],[40,32]])',box);
pts.slice(1).forEach((p,i)=>assert(p[0]===pts[i][0]||p[1]===pts[i][1]));
api.importDXF(api.dxf());assert(api.getProject().cadLines.length>1);
assert(store.get('ite-rilievo-proto-0.2').includes('cadLines'));
console.log('PASS rilievo v0.2: ambienti, componenti, collegamenti, computo, voce, DXF, revisioni, disegno libero, autosave');
