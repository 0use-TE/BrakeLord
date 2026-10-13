import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { Game, STEP, VEHICLES, TRACK } from '../shared/simulation.js';
function original(){
  const context={};vm.runInNewContext(fs.readFileSync(new URL('./fixtures/original-config.txt',import.meta.url),'utf8')+fs.readFileSync(new URL('./fixtures/original-physics.txt',import.meta.url),'utf8'),context);
  return new context.ng();
}
test('V800在2公里内刹停，逐物理步与原始制动规则一致',()=>{
  const a=original(),b=new Game(VEHICLES[0]);a.start();b.start();
  while(a.phase==='countdown'){a.step(STEP,false);b.step(STEP,false);}
  for(let i=0;i<3000;i++){a.step(STEP,false);b.step(STEP,false);}
  while(!['stopped','crashed'].includes(a.phase)){
    const d=a.dynamics,press=d.pedalForce+(200+800*(d.holdTime+STEP))*STEP<1612;
    a.step(STEP,press);b.step(STEP,press);
    assert.equal(b.phase,a.phase);assert.equal(b.dynamics.speed,a.dynamics.speed);
    assert.equal(b.dynamics.distance,a.dynamics.distance);assert.equal(b.dynamics.pedalForce,a.dynamics.pedalForce);
  }
  assert.equal(b.finalResult.success,true);assert.equal(b.finalResult.score,a.result(true).score);assert.equal(b.finalResult.stopSeconds,a.result(true).stopSeconds);
});
test('所有车型：过早踩不能切断动力，踩断不计分',()=>{
  for(const vehicle of VEHICLES){
    const game=new Game(vehicle);game.start();while(game.phase==='countdown')game.step(STEP,true);
    game.step(STEP,true);assert.equal(game.dynamics.powerCut,false);
    for(let i=0;i<3000&&game.phase!=='crashed';i++)game.step(STEP,true);
    assert.equal(game.phase,'crashed');assert.equal(game.finalResult.reason,'brake_snap');assert.equal(game.finalResult.score,0);
  }
});
test('松开减力、计时清零、动力不恢复，断裂先于成功停车',()=>{
  const g=new Game();g.start();g.phase='braking';g.dynamics.powerCut=true;
  g.dynamics.speed=10;g.dynamics.pedalForce=1000;g.dynamics.holdTime=1;
  g.step(STEP,false);assert.equal(g.dynamics.pedalForce,992.5);assert.equal(g.dynamics.holdTime,0);assert.equal(g.dynamics.powerCut,true);
  g.dynamics.speed=.001;g.dynamics.pedalForce=1611;g.step(STEP,true);
  assert.equal(g.finalResult.reason,'brake_snap');assert.equal(g.finalResult.success,false);
});
test('2公里路障与车头碰撞线一致，先碰撞再判停',()=>{
  assert.equal(TRACK.barrierDistance,2000);
  const g=new Game();assert.equal(g.distanceToBarrier,1997.3);g.start();g.phase='braking';g.dynamics.powerCut=true;g.dynamics.distance=1997.3;g.dynamics.speed=.001;
  g.step(STEP,false);assert.equal(g.finalResult.reason,'barrier');
});
