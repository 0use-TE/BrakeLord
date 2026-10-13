import test from 'node:test';
import assert from 'node:assert/strict';
import {bindingsFromCodes,assignBinding,keyLabel} from '../shared/key-bindings.js';
import {LocalMatch} from '../shared/local-match.js';
import {STEP} from '../shared/simulation.js';
test('小键盘与主键盘数字、Enter是不同的物理键',()=>{
 const bindings=bindingsFromCodes(['Digit1','Numpad1','Enter','NumpadEnter']);
 const match=new LocalMatch(['v800','v800','v800','v800'],bindings);
 for(let i=0;i<1000;i++)match.advance(STEP);
 match.input('Numpad1',true);match.advance(STEP);
 assert.equal(match.players[0].game.dynamics.powerCut,false);
 assert.equal(match.players[1].game.dynamics.powerCut,true);
 match.input('Numpad1',false);match.input('NumpadEnter',true);match.advance(STEP);
 assert.equal(match.players[2].game.dynamics.powerCut,false);assert.equal(match.players[3].game.dynamics.powerCut,true);
 assert.equal(keyLabel('Numpad1'),'小键盘 1');assert.equal(keyLabel('NumpadEnter'),'小键盘 ↵');
});
test('重复键位不可开赛，配置不能被比赛实例外部改写',()=>{
 const bindings=bindingsFromCodes();
 assert.ok(assignBinding(bindings,0,'KeyL',2).error);
 assert.throws(()=>new LocalMatch(['v800','v800'],[{code:'KeyA'},{code:'KeyA'}]));
 const match=new LocalMatch(['v800','v800'],bindings);bindings[0].code='KeyZ';assert.equal(match.players[0].key.code,'KeyA');
 assert.throws(()=>bindingsFromCodes(['KeyA','KeyA','KeyS','KeyK']));
});
test('支持空格、方向键、小键盘运算符；未出场玩家不占用键位',()=>{
 const bindings=bindingsFromCodes();const assigned=assignBinding(bindings,0,'KeyS',2);
 assert.equal(assigned.bindings[0].code,'KeyS');assert.equal(assigned.bindings[2].code,'KeyA');
 assert.equal(new Set(assigned.bindings.map(k=>k.code)).size,4);
 for(const code of ['Space','ArrowLeft','NumpadAdd','NumpadDecimal'])assert.ok(assignBinding(bindings,0,code,2).bindings);
 assert.ok(assignBinding(bindings,0,'Escape',2).error);
 assert.ok(assignBinding(bindings,0,'Unidentified',2).error);
});
