const defaults={v800:'沪·V80001',s800:'沪·S80002',m9:'渝·M90003',l9:'京·L90009'};
export function normalizePlate(value,fallback=''){
 return [...String(value||'').toUpperCase().replace(/[^\p{Script=Han}A-Z0-9·]/gu,'')].slice(0,9).join('')||fallback;
}
export function defaultPlate(id){return defaults[id]||defaults.v800;}
export function loadPlate(id){
 try{return normalizePlate(localStorage.getItem('zun-plate:'+id),defaultPlate(id));}catch{return defaultPlate(id);}
}
export function savePlate(id,value){
 const plate=normalizePlate(value,defaultPlate(id));try{localStorage.setItem('zun-plate:'+id,plate);}catch{}return plate;
}
export function seatPlate(index){return '京·P'+(index+1)+'000'+(index+1);}
