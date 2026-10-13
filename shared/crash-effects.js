// Stylized game effects, independent of driving physics and scores.
export const CRASH_STYLES=Object.freeze({
 v800:{color:0xffb354,smoke:0x8d8174,spread:19,lift:9,ring:9,wheels:[0,3],panels:3},
 s800:{color:0x8edbff,smoke:0x687884,spread:24,lift:7,ring:11,wheels:[0,1],panels:4},
 m9:{color:0xff743c,smoke:0x756d65,spread:17,lift:12,ring:8,wheels:[0,3],panels:3},
 l9:{color:0xffd98d,smoke:0x7d8072,spread:22,lift:10,ring:10,wheels:[1,2],panels:4}
});
export function crashStyle(id){return CRASH_STYLES[id]||CRASH_STYLES.v800;}
export function scatterVelocity(style,speed,index,count,random=Math.random){
 const angle=(index+.25+random()*.5)/count*Math.PI*2,radius=style.spread*(.55+random()*.45);
 return {x:Math.cos(angle)*radius,y:style.lift*(.55+random()*.65),z:-speed*.45+Math.sin(angle)*radius};
}
