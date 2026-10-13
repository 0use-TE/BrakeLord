import test from 'node:test';
import assert from 'node:assert/strict';
import {FinishSequence,CRASH_SECONDS,STOP_SECONDS} from '../shared/finish-sequence.js';
test('踏板断裂和碰撞均等待完整5.5秒收场，正常刹停等待1.8秒',()=>{
 for(const reason of ['brake_snap','barrier']){
  const ending=new FinishSequence();ending.advance(20,null);assert.equal(ending.age,0);
  ending.advance(CRASH_SECONDS-.01,{success:false,reason});assert.equal(ending.complete,false);
  ending.advance(.02,{success:false,reason});assert.equal(ending.complete,true);
 }
 const stopped=new FinishSequence();stopped.advance(STOP_SECONDS-.01,{success:true});assert.equal(stopped.complete,false);
 stopped.advance(.02,{success:true});assert.equal(stopped.complete,true);
});
test('最后一名玩家判定失败后仍须播放自己的动画；慢动作逐渐恢复',()=>{
 const first=new FinishSequence(),last=new FinishSequence();
 first.advance(8,{success:false});last.advance(8,null);
 assert.equal(first.complete,true);assert.equal(last.complete,false);
 last.advance(.5,{success:false});assert.equal(last.physicsScale,.28);
 last.advance(1.7,{success:false});assert.ok(last.physicsScale>.28&&last.physicsScale<1);
 last.advance(3.4,{success:false});assert.equal(last.physicsScale,1);
 assert.ok([first,last].every(ending=>ending.complete));
});
