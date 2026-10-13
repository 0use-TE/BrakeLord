import { Game, STEP, vehicleById } from './simulation.js';
import { bindingsFromCodes, supportedKey, keyLabel } from './key-bindings.js';
export const LOCAL_KEYS = bindingsFromCodes();
export class LocalMatch {
  constructor(vehicleIds,bindings=LOCAL_KEYS,seats=vehicleIds.map((_,i)=>i)){
    if(vehicleIds.length<2||vehicleIds.length>4||vehicleIds.some(id=>!vehicleById(id)))throw Error('同屏支持2–4人');
    const keys=bindings.slice(0,vehicleIds.length);
    if(keys.length!==vehicleIds.length||keys.some(key=>!supportedKey(key?.code))||new Set(keys.map(key=>key.code)).size!==keys.length)throw Error('各玩家键位必须有效且互不重复');
    if(seats.length!==vehicleIds.length||seats.some(i=>!Number.isInteger(i)||i<0||i>3)||new Set(seats).size!==seats.length)throw Error('玩家位置必须有效且互不重复');
    this.players=vehicleIds.map((vehicleId,index)=>({id:'local-'+seats[index],name:'P'+(seats[index]+1),vehicleId,key:{code:keys[index].code,label:keyLabel(keys[index].code)},pressed:false,game:new Game(vehicleById(vehicleId))}));
    this.accumulator=0;this.finished=false;this.previousDistances=this.players.map(()=>0);for(const p of this.players)p.game.start();
  }
  input(code,held){const p=this.players.find(p=>p.key.code===code);if(!p)return false;p.pressed=Boolean(held);return true;}
  releaseAll(){for(const p of this.players)p.pressed=false;}
  advance(elapsed){
    const events=[];if(this.finished)return events;this.accumulator+=Math.min(.1,Math.max(0,elapsed));
    while(this.accumulator>=STEP){this.accumulator-=STEP;
      for(const [index,p] of this.players.entries()){this.previousDistances[index]=p.game.dynamics.distance;if(p.game.finalResult)continue;const messages=p.game.step(STEP,p.pressed);if(messages.length)events.push({id:p.id,events:messages});}
      if(this.players.every(p=>p.game.finalResult)){this.finished=true;this.releaseAll();break;}
    }return events;
  }
  snapshots(){return this.players.map(p=>({id:p.id,name:p.name,vehicleId:p.vehicleId,pressed:p.pressed,result:p.game.finalResult,game:p.game.snapshot()}));}
  renderSnapshots(){
    const alpha=Math.min(1,this.accumulator/STEP);
    return this.snapshots().map((p,index)=>{
      if(!p.result)p.game.distance=this.previousDistances[index]+(p.game.distance-this.previousDistances[index])*alpha;
      return p;
    });
  }
}
