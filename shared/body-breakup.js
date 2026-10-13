export function bodySection(x,y,z){
 if(y<.48)return x<0?'底盘左':'底盘右';
 if(z<-2.15)return '前保险杠';
 if(z>2.15)return '尾门';
 if(y>1.82)return '车顶';
 if(z<-1.25)return '引擎盖';
 if(z<-.5&&y>1.25&&Math.abs(x)<.8)return '挡风玻璃';
 return (x<0?'左':'右')+(z<.45?'前门':'后门');
}
