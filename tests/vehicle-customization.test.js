import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePlate,defaultPlate,seatPlate} from '../shared/plates.js';
import {CRASH_STYLES,scatterVelocity} from '../shared/crash-effects.js';
import {VEHICLES} from '../shared/simulation.js';
test('四种车型包含 L9，默认车牌各不相同',()=>{assert.equal(VEHICLES.length,4);assert.ok(VEHICLES.some(v=>v.id==='l9'));assert.equal(new Set(VEHICLES.map(v=>defaultPlate(v.id))).size,4);assert.equal(new Set([0,1,2,3].map(seatPlate)).size,4);});
test('车牌过滤标点、统一大写、限制九个字符并保留中文',()=>{assert.equal(normalizePlate(' 苏·ab12-34! '),'苏·AB1234');assert.equal(normalizePlate('!@','沪·A12345'),'沪·A12345');assert.equal([...normalizePlate('京ABCDEFGHIJK')].length,9);});
test('碎片按车型覆盖四周，扩散速度和高度有界',()=>{assert.equal(new Set(Object.values(CRASH_STYLES).map(v=>v.color)).size,4);for(const style of Object.values(CRASH_STYLES)){const velocities=Array.from({length:8},(_,i)=>scatterVelocity(style,50,i,8,()=>.5));assert.ok(velocities.some(v=>v.x<0)&&velocities.some(v=>v.x>0));assert.ok(velocities.some(v=>v.z<-22.5)&&velocities.some(v=>v.z>-22.5));for(const v of velocities){assert.ok(Math.hypot(v.x,v.z+22.5)<=style.spread);assert.ok(v.y>0&&v.y<=style.lift*1.2);}assert.ok(style.panels<=4);}});
