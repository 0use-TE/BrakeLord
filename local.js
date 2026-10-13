import {normalizePlate,seatPlate} from './shared/plates.js';
import { VEHICLES, vehicleById } from './shared/simulation.js';
import { LocalMatch } from './shared/local-match.js';
import { DEFAULT_KEYS, bindingsFromCodes, assignBinding } from './shared/key-bindings.js';
const $=id=>document.getElementById(id);
export function setupLocal({display,showGarage,currentVehicle}){
 let joined=[true,true,false,false],configured=false,count=2,ids=Array(4).fill(VEHICLES[0].id),match=null,frame=null,lastDraw=0,padLayout='',padNodes=new Map,viewNodes=[];
 let plates=Array.from({length:4},(_,i)=>seatPlate(i));try{const saved=JSON.parse(localStorage.getItem('zun-local-plates')||'null');if(Array.isArray(saved))plates=plates.map((p,i)=>normalizePlate(saved[i],p));}catch{}
 const withPlates=players=>players.map(p=>({...p,plate:plates[Number(p.id.split('-').at(-1))]}));
 const storageKey='zun-local-key-bindings-v1';let bindings=bindingsFromCodes(),recording=null,suppressKeyUp=null;
 try{const saved=localStorage.getItem(storageKey);if(saved)bindings=bindingsFromCodes(JSON.parse(saved));}catch{}
 function saveBindings(){try{localStorage.setItem(storageKey,JSON.stringify(bindings.map(key=>key.code)));}catch{}}
 function activeSeats(){return joined.flatMap((active,i)=>active?[i]:[]);}
 function cancelRecording(){recording=null;$('localBindingMessage').textContent='点击键位可更改 · 支持小键盘';drawSetup();}
 function drawSetup(){
  const seats=activeSeats();count=seats.length;
  $('localPlayerCount').textContent=count+' / 4 人';
  $('startLocal').disabled=count<2||recording!==null;
  $('startLocal').textContent=count<2?'至少加入 2 人':'开始对战';
  $('localVehicles').replaceChildren();
  for(let i=0;i<4;i++){
   const v=vehicleById(ids[i]),card=document.createElement('article');card.className='local-seat'+(joined[i]?' joined':' empty');card.style.setProperty('--seat-color',['#f0cd89','#91cfe6','#c8a2ed','#b0d59c'][i]);card.setAttribute('aria-label','P'+(i+1)+'玩家位');
   const heading=document.createElement('header'),player=document.createElement('strong');player.textContent='P'+(i+1);heading.append(player);
   if(joined[i]){const remove=document.createElement('button');remove.className='seat-remove';remove.textContent='退出';remove.setAttribute('aria-label','移除P'+(i+1));remove.onclick=()=>{joined[i]=false;cancelRecording();};heading.append(remove);}else{const status=document.createElement('span');status.textContent='空位';heading.append(status);}card.append(heading);
   const preview=document.createElement('div');preview.className='seat-preview';preview.dataset.preview=i;preview.setAttribute('aria-label',joined[i]?v.name+'模型':'空玩家位');card.append(preview);
   if(!joined[i]){
    const join=document.createElement('button');join.className='seat-join';join.setAttribute('aria-label','加入P'+(i+1));join.innerHTML='<span>＋</span>加入玩家';join.onclick=()=>{joined[i]=true;cancelRecording();};card.append(join);
   }else{
    const picker=document.createElement('div');picker.className='seat-picker';
    const prev=document.createElement('button');prev.textContent='‹';prev.setAttribute('aria-label','P'+(i+1)+'上一辆');
    const name=document.createElement('b');name.textContent=v.name;
    const next=document.createElement('button');next.textContent='›';next.setAttribute('aria-label','P'+(i+1)+'下一辆');
    const cycle=d=>{const index=VEHICLES.findIndex(v=>v.id===ids[i]);ids[i]=VEHICLES[(index+d+VEHICLES.length)%VEHICLES.length].id;drawSetup();};prev.onclick=()=>cycle(-1);next.onclick=()=>cycle(1);picker.append(prev,name,next);card.append(picker);
    const plate=document.createElement('input');plate.className='seat-plate';plate.value=plates[i];plate.maxLength=9;plate.setAttribute('aria-label','P'+(i+1)+'车牌号');
    for(const type of ['keydown','keyup'])plate.addEventListener(type,event=>event.stopPropagation());
    plate.onchange=()=>{plates[i]=normalizePlate(plate.value,seatPlate(i));plate.value=plates[i];try{localStorage.setItem('zun-local-plates',JSON.stringify(plates));}catch{}window.brakeGame?.setupSlots(ids.map((vehicleId,j)=>({vehicleId,joined:joined[j],plate:plates[j]})));};card.append(plate);
    const stats=document.createElement('div');stats.className='seat-stats';
    for(const [label,value,max] of [['极速',v.car.maxSpeedKmh+' km/h',v.car.maxSpeedKmh/260],['耐受',v.brake.breakForceN+' N',v.brake.breakForceN/2100],['制动',(v.brake.breakForceN*v.brake.decelPerNewton).toFixed(1)+' m/s²',v.brake.breakForceN*v.brake.decelPerNewton/13]]){const row=document.createElement('div');row.innerHTML='<span>'+label+'</span><b>'+value+'</b><i><em style="width:'+max*100+'%"></em></i>';stats.append(row);}card.append(stats);
    const key=document.createElement('button');key.className='seat-key'+(recording===i?' recording':'');key.setAttribute('aria-label','设置P'+(i+1)+'键位');key.innerHTML='<span>刹车键</span><kbd>'+(recording===i?'按键…':bindings[i].label)+'</kbd>';key.onclick=()=>{recording=i;$('localBindingMessage').textContent='P'+(i+1)+'：按一个键，Esc 取消';drawSetup();};card.append(key);
   }
   $('localVehicles').append(card);
  }
  if(!$('localSetup').classList.contains('hidden'))window.brakeGame?.setupSlots(ids.map((vehicleId,i)=>({vehicleId,joined:joined[i],plate:plates[i]})));
 }
 function openSetup(){
  if(!configured){const first=VEHICLES.findIndex(v=>v.id===currentVehicle());ids=VEHICLES.map((_,i)=>VEHICLES[(first+i)%VEHICLES.length].id);configured=true;}
  stop();display('garage',false);display('backSolo',false);display('localSetup',true);
  document.body.classList.add('local-preparing');window.brakeGame?.beginSetup();cancelRecording();
 }
 function stop(){
  recording=null;suppressKeyUp=null;$('startLocal').disabled=false;
  frame=null;match?.releaseAll();match=null;padLayout='';padNodes.clear();viewNodes=[];
  document.body.classList.remove('local-racing','local-preparing');display('localRace',false);display('localResults',false);display('localSetup',false);
 }
 function drawPads(){
  const views=window.brakeGame.localViews(),layout=views.map(rect=>[rect.ids.join('|'),rect.x,rect.y,rect.width,rect.height].join(':')).join(';');
  if(layout!==padLayout){
  padLayout=layout;padNodes.clear();viewNodes=[];$('localPads').replaceChildren();
  for(const rect of views){
   const pane=document.createElement('section');pane.className='dynamic-pane'+(rect.height<420?' compact':'');
   Object.assign(pane.style,{left:rect.x+'px',top:rect.y+'px',width:rect.width+'px',height:rect.height+'px'});
   const members=rect.ids.map(id=>match.players.find(p=>p.id===id));pane.setAttribute('aria-label',members.map(p=>p.name).join(' · ')+'视角');
   const pads=document.createElement('div');pads.className='dynamic-hud';pads.style.setProperty('--members',members.length);
   for(const p of members){
   const pad=document.createElement('section');pad.className='dynamic-player'+(p.pressed?' holding':'');pad.style.setProperty('--car-color',vehicleById(p.vehicleId).color);pad.setAttribute('aria-label',p.name+'状态');
   const header=document.createElement('div');header.className='split-header';const key=document.createElement('kbd');key.textContent=p.key.label;const title=document.createElement('b');title.textContent=p.name+' · '+vehicleById(p.vehicleId).name;header.append(title,key);
   const telemetry=document.createElement('div');telemetry.className='split-telemetry';telemetry.textContent=Math.max(0,Math.round(p.game.distanceToBarrier))+' m · '+p.game.brakeElapsed.toFixed(3)+' s';
   const speed=document.createElement('div');speed.className='split-speed';speed.textContent=Math.round(p.game.dynamics.speedKmh);const unit=document.createElement('small');unit.textContent='km/h';speed.append(unit);
   const force=document.createElement('div');force.className='split-force';const pedal=document.createElement('div');pedal.textContent=(p.pressed?'按住':'松开')+' · '+Math.round(p.game.dynamics.pedalForce)+' / '+p.game.vehicle.brake.breakForceN+' N';
   const bar=document.createElement('div');bar.className='peer-force';const fill=document.createElement('i');fill.style.width=Math.min(100,p.game.dynamics.pedalForce/p.game.vehicle.brake.breakForceN*100)+'%';bar.append(fill);
   force.append(pedal,bar);pad.append(header,telemetry,speed,force);
   const result=document.createElement('div');result.className='split-outcome hidden';pad.append(result);
   padNodes.set(p.id,{pad,telemetry,speed,pedal,fill,result});
   pads.append(pad);
   }
   pane.append(pads);
   const countdown=document.createElement('div');countdown.className='view-countdown hidden';pane.append(countdown);viewNodes.push({members,countdown});
   $('localPads').append(pane);
  }
  }
  const setText=(node,text)=>{if(node.textContent!==text)node.textContent=text;};
  for(const p of match.players){
   const nodes=padNodes.get(p.id);if(!nodes)continue;
   nodes.pad.classList.toggle('holding',p.pressed);
   setText(nodes.telemetry,Math.max(0,Math.round(p.game.distanceToBarrier))+' m · '+p.game.brakeElapsed.toFixed(3)+' s');
   const value=String(Math.round(p.game.dynamics.speedKmh));if(nodes.speed.firstChild.nodeValue!==value)nodes.speed.firstChild.nodeValue=value;
   setText(nodes.pedal,(p.pressed?'按住':'松开')+' · '+Math.round(p.game.dynamics.pedalForce)+' / '+p.game.vehicle.brake.breakForceN+' N');
   const width=Math.min(100,p.game.dynamics.pedalForce/p.game.vehicle.brake.breakForceN*100)+'%';if(nodes.fill.style.width!==width)nodes.fill.style.width=width;
   const result=p.game.finalResult;nodes.pad.classList.toggle('finished',Boolean(result));nodes.result.classList.toggle('hidden',!result);
   if(result)setText(nodes.result,result.success?result.score+' 分':result.reason==='brake_snap'?'踏板断裂！':'撞上路障！');
  }
  for(const {members,countdown} of viewNodes){const active=members.every(p=>p.game.phase==='countdown');countdown.classList.toggle('hidden',!active);if(active)setText(countdown,String(Math.max(1,Math.ceil(members[0].game.countdown))));}
 }
 function finish(){
  match.releaseAll();window.brakeGame.lobby();document.body.classList.remove('local-racing','local-preparing');display('localRace',false);display('localResults',true);
  $('localRanks').replaceChildren();const ranked=[...match.players].sort((a,b)=>b.game.finalResult.score-a.game.finalResult.score);
  for(const [rank,p] of ranked.entries()){
   const row=document.createElement('div');row.className='local-rank';
   const name=document.createElement('span');name.textContent=(rank+1)+'. '+p.name+' · '+vehicleById(p.vehicleId).name;
   const points=document.createElement('strong');points.textContent=p.game.finalResult.success?p.game.finalResult.score+' 分':'失败';points.title=p.game.finalResult.success?'基础分 '+p.game.finalResult.baseScore+' × 车型系数 '+p.game.finalResult.scoreScale:'';row.append(name,points);$('localRanks').append(row);
  }
 }
 function tick(dt){
  if(!match||frame===null)return;
  const events=match.advance(dt);window.brakeGame.splitFrame(withPlates(match.renderSnapshots()),events);
  if(match.finished&&window.brakeGame.splitComplete()){drawPads();finish();frame=null;return;}
 }
 window.addEventListener('local-frame',event=>tick(event.detail));
 window.addEventListener('local-render',()=>{if(!match||frame===null)return;const now=performance.now();if(now-lastDraw>50){drawPads();lastDraw=now;}});
 window.addEventListener('local-layout',()=>{if(match&&frame!==null)drawPads();});
 function start(){
  if(!window.brakeGame||recording!==null||activeSeats().length<2)return;const seats=activeSeats();stop();count=seats.length;match=new LocalMatch(seats.map(i=>ids[i]),seats.map(i=>bindings[i]),seats);
  window.brakeGame.beginSplit(withPlates(match.snapshots()));
  display('garage',false);display('backSolo',false);display('localRace',true);
  document.body.classList.add('local-racing');lastDraw=0;drawPads();frame=true;
 }
 $('openLocal').onclick=()=>{if(!window.brakeGame)return;openSetup();};
 $('closeLocal').onclick=()=>{stop();showGarage();};
 $('resetLocalKeys').onclick=()=>{bindings=bindingsFromCodes(DEFAULT_KEYS);saveBindings();cancelRecording();};
 $('startLocal').onclick=start;$('localAgain').onclick=start;
 $('exitLocal').onclick=$('localGarage').onclick=openSetup;
 for(const type of ['keydown','keyup'])window.addEventListener(type,event=>{
  if(type==='keyup'&&event.code===suppressKeyUp){suppressKeyUp=null;event.preventDefault();event.stopImmediatePropagation();return;}
  if(recording!==null){
   event.preventDefault();event.stopImmediatePropagation();if(type!=='keydown'||event.repeat||event.isComposing)return;
   suppressKeyUp=event.code;
   if(event.code==='Escape'){cancelRecording();return;}
   const result=assignBinding(bindings,recording,event.code,activeSeats());
   if(result.error){$('localBindingMessage').textContent=result.error;return;}
   bindings=result.bindings;saveBindings();recording=null;$('startLocal').disabled=false;$('localBindingMessage').textContent='已保存 · 点击键位可更改';drawSetup();return;
  }
  if(!$('localSetup').classList.contains('hidden')){if(['Space','Enter','ArrowLeft','ArrowRight'].includes(event.code)&&event.target===document.body)event.preventDefault();return;}
  if(!match)return;
  if(match.players.some(p=>p.key.code===event.code)){if(!match.finished)match.input(event.code,type==='keydown');event.preventDefault();event.stopImmediatePropagation();}
  else if(['Space','ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 window.addEventListener('blur',()=>{match?.releaseAll();if(recording!==null)cancelRecording();});
 window.addEventListener('resize',()=>{if(match&&document.body.classList.contains('local-racing'))drawPads();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)match?.releaseAll();});
 return {stop,get active(){return frame!==null;}};
}
