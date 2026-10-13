import test from 'node:test';
import assert from 'node:assert/strict';
import {localLayout,localViewCamera} from '../shared/local-layout.js';
test('人数决定连续居中的车道，空玩家位不留下空车道',()=>{
 for(const count of [2,3,4]){const layout=localLayout(count);assert.equal(layout.lanes.length,count);assert.equal(layout.roadWidth,count*3.6);assert.ok(Math.abs(layout.lanes.reduce((a,b)=>a+b,0))<1e-10);for(let i=1;i<count;i++)assert.ok(Math.abs(layout.lanes[i]-layout.lanes[i-1]-3.6)<1e-10);}
 assert.throws(()=>localLayout(1));
});
test('分视角随本人前进，窄视口仍能容纳身旁车道',()=>{
 const focus={x:5.4,y:0,z:-500},before=localViewCamera(focus,14.4,.7),after=localViewCamera({...focus,z:-600},14.4,.7);
 assert.ok(Math.abs(after.position.z-before.position.z+100)<1e-9);assert.equal(after.target.z-before.target.z,-100);
 const halfWidth=(before.position.z-focus.z)*Math.tan(before.fov*Math.PI/360)*.7;
 assert.ok(halfWidth>=14.4/2);
 assert.ok(localViewCamera(focus,14.4,.4).position.z>before.position.z);
});
test('翻车镜头跟随本人的物理位置，包括甩出车道和腾空',()=>{
 const focus={x:8,y:3,z:-750},camera=localViewCamera(focus,7.2,1,true);
 assert.deepEqual(camera.target,focus);assert.ok(camera.position.y>focus.y);assert.ok(camera.position.z>focus.z);
});
