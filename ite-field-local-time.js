/* I.T.E. 4.0 — strict local datetime validation for appointment entry. */
(function(root){'use strict';
const pad=n=>String(n).padStart(2,'0');
function parseLocal(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('DATA_ORA_FORMATO_NON_VALIDO');
 const [year,month,day,hour,minute]=value.match(/\d+/g).map(Number);
 const date=new Date(year,month-1,day,hour,minute,0,0);
 if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day||date.getHours()!==hour||date.getMinutes()!==minute)throw Error('DATA_ORA_INESISTENTE');
 const next=new Date(date.getTime()+3600000);
 if(next.getFullYear()===year&&next.getMonth()===month-1&&next.getDate()===day&&next.getHours()===hour&&next.getMinutes()===minute)throw Error('DATA_ORA_AMBIGUA_CAMBIO_ORA');
 return date.toISOString();
}
function toLocal(value){
 const d=new Date(value);if(!Number.isFinite(d.getTime()))throw Error('DATA_ORA_NON_VALIDA');
 return [d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-')+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
}
const api=Object.freeze({parseLocal,toLocal});root.ITEFieldLocalTime=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
