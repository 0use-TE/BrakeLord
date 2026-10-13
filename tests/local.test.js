import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalMatch} from '../shared/local-match.js';
import {Game,STEP} from '../shared/simulation.js';
import {bindingsFromCodes,assignBinding} from '../shared/key-bindings.js';

test('渲染按物理步余量插值，144Hz中间帧也前进，不改写真实比赛位置',()=>{
 const match=new LocalMatch(['v800','s800']);
 for(const p of match.players){p.game.phase='accelerating';p.game.dynamics.speed=50;}
 match.advance(STEP);const distances=match.snapshots().map(p=>p.game.distance);
 assert.ok(distances.every(d=>d>0));assert.deepEqual(match.renderSnapshots().map(p=>p.game.distance),[0,0]);
 for(let part=1;part<=3;part++){
  match.advance(STEP/4);
  const rendered=match.renderSnapshots();
  for(let i=0;i<2;i++)assert.ok(Math.abs(rendered[i].game.distance-distances[i]*part/4)<1e-10);
  assert.deepEqual(match.snapshots().map(p=>p.game.distance),distances);
 }
 match.advance(STEP/4);
 for(let i=0;i<2;i++)assert.ok(Math.abs(match.renderSnapshots()[i].game.distance-distances[i])<1e-10);
});
test('一个人断踏板不结束全局，其余人仍能继续操作',()=>{
 const match=new LocalMatch(['v800','s800']);match.input('KeyA',true);
 for(let tick=0;tick<2000&&!match.players[0].game.finalResult;tick++)match.advance(STEP);
 assert.equal(match.players[0].game.finalResult.reason,'brake_snap');assert.equal(match.players[1].game.finalResult,null);
 assert.equal(match.finished,false);assert.equal(match.input('KeyL',true),true);
 for(let tick=0;tick<2000&&!match.finished;tick++)match.advance(STEP);
 assert.equal(match.players[1].game.finalResult.reason,'brake_snap');assert.equal(match.finished,true);
});
test('空位可以单独加入退出，P1/P4保留各自编号与键位',()=>{
 const bindings=bindingsFromCodes();
 const match=new LocalMatch(['v800','m9'],[bindings[0],bindings[3]],[0,3]);
 assert.deepEqual(match.players.map(p=>p.name),['P1','P4']);
 assert.deepEqual(match.snapshots().map(p=>p.id),['local-0','local-3']);
 assert.equal(match.input('KeyL',true),false);assert.equal(match.input('KeyK',true),true);
 assert.equal(match.players[0].pressed,false);assert.equal(match.players[1].pressed,true);
 assert.throws(()=>new LocalMatch(['v800','m9'],bindings,[0,0]));
});
test('任意玩家位的键位冲突只受已加入玩家影响',()=>{
 const bindings=bindingsFromCodes();
 assert.ok(assignBinding(bindings,0,'KeyK',[0,3]).error);
 const result=assignBinding(bindings,0,'KeyL',[0,3]);
 assert.equal(result.bindings[0].code,'KeyL');assert.equal(result.bindings[1].code,'KeyA');
 assert.equal(new Set(result.bindings.map(key=>key.code)).size,4);
});
test('同时按键相互独立，按住与松开分别作用于本人',()=>{
 const match=new LocalMatch(['v800','v800']);for(let i=0;i<1000;i++)match.advance(STEP);
 match.input('KeyA',true);match.input('KeyL',true);match.advance(.08);
 assert.ok(match.players.every(p=>p.game.dynamics.powerCut));
 const before=match.players.map(p=>p.game.dynamics.pedalForce);
 match.input('KeyA',false);match.advance(.08);
 assert.ok(match.players[0].game.dynamics.pedalForce<before[0]);assert.ok(match.players[1].game.dynamics.pedalForce>before[1]);
 match.releaseAll();assert.ok(match.players.every(p=>!p.pressed));
});
test('四人同屏与各自独立运行同一规则一致，全部失败才结算',()=>{
 const match=new LocalMatch(['v800','m9','s800','v800']);
 const controls=match.players.map(p=>{const g=new Game(p.game.vehicle);g.start();return g;});
 for(const p of match.players)match.input(p.key.code,true);
 for(let i=0;i<2000&&!match.finished;i++){
  match.advance(STEP);for(const g of controls)g.step(STEP,true);
  for(let j=0;j<4;j++){assert.equal(match.players[j].game.phase,controls[j].phase);assert.equal(match.players[j].game.dynamics.speed,controls[j].dynamics.speed);}
 }
 assert.ok(match.finished);assert.ok(match.players.every(p=>p.game.finalResult.score===0));
 assert.equal(match.input('Space',true),false);
});
