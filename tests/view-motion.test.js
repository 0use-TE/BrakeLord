import test from 'node:test';
import assert from 'node:assert/strict';
import {ViewMotion} from '../shared/view-motion.js';
import {localViewCamera} from '../shared/local-layout.js';

test('高速跟车在不均匀帧间隔下仍保持固定相对位置，不积累镜头迟滞',()=>{
 const motion=new ViewMotion;let z=0;
 for(let i=0;i<500;i++){
  const dt=[1/144,1/60,1/90,.047,1/120][i%5];z-=70*dt;
  const focus={x:1.8,y:0,z},framing=localViewCamera(focus,7.2,1.3);
  motion.update(framing,focus,dt);
  assert.ok(Math.abs(motion.position.z-z-12)<1e-9);
  assert.ok(Math.abs(motion.target.z-z-2)<1e-9);
 }
});

test('分屏改构图缓动过渡，翻车镜头保持缓动，互不污染',()=>{
 const a=new ViewMotion({x:0,y:12,z:20},{x:0,y:.8,z:2}),b=new ViewMotion;
 const focus={x:1.8,y:0,z:-100},framing=localViewCamera(focus,7.2,1.3);
 a.update(framing,focus,1/60);assert.ok(a.position.z>framing.position.z&&a.position.z<20);
 b.update(framing,focus,1/60);const before={...b.position};
 const crashFocus={x:8,y:4,z:-130},crash=localViewCamera(crashFocus,7.2,1.3,true);
 a.update(crash,crashFocus,1/60,false);assert.notEqual(a.position.z,crash.position.z);
 assert.deepEqual(b.position,before);
});
