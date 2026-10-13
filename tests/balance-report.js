import { Dynamics, VEHICLES, STEP, score, vehicleScore,TRACK } from '../shared/simulation.js';
const collisionDistance=TRACK.barrierDistance-TRACK.carFront;
export function benchmark(vehicle){
 const engine=new Dynamics(vehicle),starts=[];
 for(let tick=0;engine.distance<collisionDistance&&tick<10000;tick++){
  if(engine.speedKmh>=100)starts.push({speed:engine.speed,distance:engine.distance});engine.step(STEP,false);
 }
 let best={score:0};
 for(const start of starts){
  const d=new Dynamics(vehicle);d.speed=start.speed;d.distance=start.distance;d.powerCut=true;
  for(let steps=1;steps<3000;steps++){
   const b=vehicle.brake,next=d.pedalForce+(b.rampBase+2*b.rampGrowth*(d.holdTime+STEP))*STEP;
   if(d.step(STEP,next<b.breakForceN)||d.distance>=collisionDistance)break;
   if(d.speed<=b.stopSpeed){const v=Math.round(start.speed*36)/10,t=Math.round(steps*STEP*1000)/1000,result={score:vehicleScore(vehicle,v,t),baseScore:score(v,t),v,time:t,distance:d.distance-start.distance};if(result.score>best.score)best=result;break;}
  }
 }
 return best;
}
if(process.argv.includes('--tune')){
 for(const [index,speed,force] of [[1,210,1450],[2,200,2100]])for(const decel of index===1?[12,12.5,13,13.5]:[10,10.3,10.6,10.9]){
  const v=structuredClone(VEHICLES[index]);v.car.maxSpeedKmh=speed;v.brake={...VEHICLES[0].brake,breakForceN:force,decelPerNewton:decel/force};
  console.log(v.id,speed,force,decel,JSON.stringify(benchmark(v)));
 }
}else if(process.argv[1]?.endsWith('balance-report.js'))for(const v of VEHICLES)console.log(v.id,JSON.stringify(benchmark(v)));
