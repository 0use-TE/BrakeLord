import test from 'node:test';
import assert from 'node:assert/strict';
import { VEHICLES,Dynamics,STEP,vehicleScore } from '../shared/simulation.js';
import { benchmark } from './balance-report.js';
test('三个主要属性互有取舍，不存在全面占优的车型',()=>{
  const stats=v=>[v.car.maxSpeedKmh,v.brake.breakForceN,v.brake.decelPerNewton*v.brake.breakForceN];
  for(const a of VEHICLES)for(const b of VEHICLES)if(a!==b)assert.equal(stats(a).every((value,i)=>value>=stats(b)[i]),false);
});
test('同一精准控制策略的参考最高成绩差距小于2%',()=>{
  const results=VEHICLES.map(v=>benchmark(v).score);
  assert.ok(results.every(value=>value>8900));
  assert.ok((Math.max(...results)-Math.min(...results))/Math.max(...results)<.02,JSON.stringify(results));
});
test('车型按所选实车版本校准极速和零百，不再让普通M9比S800纯电更快',()=>{
 const s=VEHICLES.find(v=>v.id==='s800'),m=VEHICLES.find(v=>v.id==='m9');
 assert.equal(s.car.maxSpeedKmh,210);assert.equal(m.car.maxSpeedKmh,200);
 for(const vehicle of [s,m]){const d=new Dynamics(vehicle);let elapsed=0;while(d.speedKmh<100){d.step(STEP,false);elapsed+=STEP;}
  assert.ok(Math.abs(elapsed-vehicle.reference.zeroTo100)<.02);
  for(let i=0;i<30000;i++)d.step(STEP,false);assert.ok(d.speedKmh<=vehicle.car.maxSpeedKmh+.001);
 }
 assert.equal(vehicleScore(VEHICLES[0],259.3,7.367),9127);
 assert.equal(vehicleScore(m,200,6.275),9128);assert.equal(vehicleScore(m,200,0),0);
});
