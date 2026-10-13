import {loadPlate,savePlate} from './shared/plates.js';
import {VEHICLES,vehicleById} from './shared/simulation.js';
import {setupLocal} from './local.js';
const $=id=>document.getElementById(id);
let selected=VEHICLES[0].id,loaded=false,localSession=null;

function display(id,show){
 $(id).classList.toggle('hidden',!show);
 if(['garage','localSetup'].includes(id))$('vehicleStats').classList.toggle('hidden',$('garage').classList.contains('hidden'));
}
function drawVehicles(){
 const index=VEHICLES.findIndex(v=>v.id===selected),v=VEHICLES[index];
 $('editPlate').textContent=loadPlate(selected);$('carName').textContent=v.name;$('carRole').textContent=v.badge;
 $('statSpeed').textContent=v.car.maxSpeedKmh+' km/h';$('statTolerance').textContent=v.brake.breakForceN+' N';
 const strength=v.brake.breakForceN*v.brake.decelPerNewton;$('statBrake').textContent=strength.toFixed(1)+' m/s²';
 $('speedBar').style.width=v.car.maxSpeedKmh/260*100+'%';$('toleranceBar').style.width=v.brake.breakForceN/2100*100+'%';$('brakeBar').style.width=strength/13*100+'%';
 $('carDots').replaceChildren(...VEHICLES.map((_,i)=>{const dot=document.createElement('i');dot.className=i===index?'active':'';return dot;}));
}
function cycleVehicle(direction){
 const index=VEHICLES.findIndex(v=>v.id===selected);selected=VEHICLES[(index+direction+VEHICLES.length)%VEHICLES.length].id;
 window.brakeGame?.select(selected);drawVehicles();
}
$('prevCar').onclick=()=>cycleVehicle(-1);$('nextCar').onclick=()=>cycleVehicle(1);
const plateDialog=$('plateDialog');
$('editPlate').onclick=()=>{$('plateInput').value=loadPlate(selected);plateDialog.showModal();$('plateInput').select();};
$('closePlate').onclick=()=>plateDialog.close();
$('plateForm').onsubmit=event=>{event.preventDefault();const plate=savePlate(selected,$('plateInput').value);window.brakeGame?.setPlate(plate);drawVehicles();plateDialog.close();};
for(const type of ['keydown','keyup'])plateDialog.addEventListener(type,event=>event.stopPropagation());
const readmeDialog=$('readmeDialog');
$('openReadme').onclick=()=>readmeDialog.showModal();$('closeReadme').onclick=()=>readmeDialog.close();
readmeDialog.addEventListener('click',event=>{
 if(event.target!==readmeDialog)return;const rect=readmeDialog.getBoundingClientRect();
 if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)readmeDialog.close();
});
for(const type of ['keydown','keyup'])readmeDialog.addEventListener(type,event=>event.stopPropagation());
function enable(){loaded=true;$('solo').disabled=false;$('solo').textContent='开始挑战';window.brakeGame.select(selected);}
if(window.brakeGame?.ready)enable();else window.addEventListener('game-ready',enable,{once:true});
drawVehicles();
$('solo').onclick=()=>{
 if(!loaded||(readmeDialog.open||plateDialog.open))return;window.brakeGame.select(selected);display('garage',false);
 display('backSolo',true);window.brakeGame.start();
};
function goGarage(){
 localSession?.stop();window.brakeGame.lobby();display('garage',true);display('backSolo',false);
 window.brakeGame.select(selected);drawVehicles();
}
$('backSolo').onclick=$('garageBtn').onclick=goGarage;
window.addEventListener('request-start',()=>{
 if(!(readmeDialog.open||plateDialog.open)&&!localSession?.active&&$('localSetup').classList.contains('hidden')&&$('localResults').classList.contains('hidden'))$('solo').click();
});
window.addEventListener('request-retry',()=>$('solo').click());
window.addEventListener('keydown',event=>{
 if((readmeDialog.open||plateDialog.open)||!['ArrowLeft','ArrowRight'].includes(event.code)||$('garage').classList.contains('hidden'))return;
 event.preventDefault();cycleVehicle(event.code==='ArrowLeft'?-1:1);
});
window.addEventListener('game-event',event=>{
 const {type,result,reason}=event.detail;if(type!=='stopped'&&type!=='crash')return;
 $('satire').textContent=result.success?'旗舰从容落地。这一次，话和车都停住了。':reason==='brake_snap'?vehicleById(selected).quip:'已完成与道路基础设施的深度接触。';
 $('scoreNote').textContent=result.success&&result.scoreScale!==1?'基础分 '+result.baseScore+' × 车型系数 '+result.scoreScale:'';
 if(result.success)try{const key='zun-best:'+selected;localStorage.setItem(key,String(Math.max(Number(localStorage.getItem(key)||0),result.score)));}catch{}
});
localSession=setupLocal({display,showGarage:goGarage,currentVehicle:()=>selected});
