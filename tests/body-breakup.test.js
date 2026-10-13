import test from 'node:test';
import assert from 'node:assert/strict';
import {bodySection} from '../shared/body-breakup.js';
test('车身表面按位置分成引擎盖、保险杠、车顶、玻璃、四门和底盘',()=>{
 const samples=[[0,1,-1.8,'引擎盖'],[0,.8,-2.4,'前保险杠'],[0,1,2.5,'尾门'],[0,2,0,'车顶'],[0,1.6,-.8,'挡风玻璃'],[-1,1,0,'左前门'],[1,1,0,'右前门'],[-1,1,1,'左后门'],[1,1,1,'右后门'],[-.6,.3,0,'底盘左'],[.6,.3,0,'底盘右']];
 for(const [x,y,z,name] of samples)assert.equal(bodySection(x,y,z),name);
});
