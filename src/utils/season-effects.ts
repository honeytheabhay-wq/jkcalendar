import type { SeasonId } from "./seasons";

export type SeasonalMotionLevel = "off" | "subtle" | "lively";
export type SeasonalEffect = "petal" | "chinar" | "mote" | "sunglow" | "mist" | "rain" | "sparkle" | "snow" | "flake";
type Scene = {kind:string;effects:SeasonalEffect[];colour:string;darkColour:string};
export const seasonalMotionLevels = [{value:"off",label:"Off"},{value:"subtle",label:"Subtle"},{value:"lively",label:"Lively"}] as const;
export function normaliseSeasonalMotion(value:unknown,legacyEnabled:unknown=true):SeasonalMotionLevel {
  return value==="off"||value==="subtle"||value==="lively"?value:legacyEnabled===false?"off":"lively";
}
export const seasonalScenes:Record<SeasonId,Scene>={
  sonth:{kind:"petals",effects:["petal","petal","chinar","petal","petal","petal","chinar","petal"],colour:"#CB7E9B",darkColour:"#F4C0D3"},
  grishm:{kind:"summer-light",effects:["sunglow","mote","mote","mote","mote","mote","mote","mote"],colour:"#D8A13A",darkColour:"#F3DB9F"},
  wahrath:{kind:"rain",effects:["mist","rain","rain","rain","mist","rain","rain","rain"],colour:"#6F8D9E",darkColour:"#C9DDE6"},
  harud:{kind:"chinar",effects:["chinar","chinar","chinar","chinar","chinar","chinar","chinar","chinar"],colour:"#BC723F",darkColour:"#EEC08C"},
  wand:{kind:"frost-glints",effects:["mist","sparkle","sparkle","sparkle","sparkle","mist","sparkle","sparkle"],colour:"#7FA6BC",darkColour:"#E6EEF5"},
  shishur:{kind:"snow",effects:["snow","snow","flake","snow","snow","snow","snow","flake"],colour:"#7FAACB",darkColour:"#F4FAFF"},
};

// Rain and snow need more, faster pieces to read as weather; everything else stays sparse and slow.
const counts:Record<SeasonId,{subtle:number;lively:number}>={sonth:{subtle:8,lively:12},grishm:{subtle:8,lively:12},wahrath:{subtle:12,lively:18},harud:{subtle:8,lively:12},wand:{subtle:8,lively:12},shishur:{subtle:14,lively:20}};
const positions=[2,88,12,76,26,64,40,54,6,82,32,69,18,94,47,59,9,72,36,85];
export function seasonalParticles(id:SeasonId,level:SeasonalMotionLevel="subtle") {
  if(level==="off")return [];
  const scene=seasonalScenes[id],lively=level==="lively";
  const count=counts[id][lively?"lively":"subtle"];
  return Array.from({length:count},(_,index)=>{
    const kind=scene.effects[index%scene.effects.length];
    const left=index%2===0;
    let width=18+(index%3)*3,height=width,x=positions[index%positions.length],y=0;
    let colour=scene.colour,darkColour=scene.darkColour,duration=24000+(index%3)*3200,opacity=.34,floor=0;
    if(kind==="petal"){width=12+(index%3)*2;height=width*1.4;}
    if(kind==="chinar"&&id==="harud"&&index%3===1){colour="#D09949";darkColour="#F3D39D";}
    if(kind==="chinar"&&id==="sonth"){colour="#7FA57D";darkColour="#BCDEB1";width=18;height=18;}
    if(kind==="sunglow"){width=260;height=260;x=52;y=-10;colour="#F2C766";duration=18000;opacity=.38;}
    if(kind==="mote"){width=7+(index%3)*3;height=width;y=35+(index*17)%60;duration=18000+(index%4)*2600;opacity=.6;floor=.55;if(index%3===2){colour="#E9C56E";}}
    if(kind==="mist"){width=200;height=80;x=left?-30:55;y=index%4<2?4:78;duration=30000;opacity=.38;colour=id==="wand"?"#D9CBB4":"#A9BFB3";darkColour=id==="wand"?"#E6D7BD":"#C2DECF";}
    if(kind==="rain"){width=1.6;height=18+(index%3)*6;duration=1700+(index%4)*260;opacity=.48;floor=.5;}
    if(kind==="sparkle"){width=14+(index%3)*5;height=width;y=8+(index*29)%80;duration=17000+(index%3)*2200;opacity=.6;floor=.5;if(index%3===1){colour="#C9A877";darkColour="#F3E2C2";}}
    if(kind==="snow"){width=4+(index%4)*2;height=width;duration=17000+(index%5)*2400;opacity=.58;floor=.55;if(index%3===1){colour="#9CC2DE";}}
    if(kind==="flake"){width=20+(index%2)*6;height=width;duration=21000;opacity=.55;floor=.5;}
    const scale=lively?1.35:1.15;
    if(kind!=="rain"&&kind!=="sunglow"&&kind!=="mist"){width*=scale;height*=scale;}
    // Rain falls in seconds, so its cycle is short; the "lively" speed-up is a gentler 0.85 for it.
    const speed=kind==="rain"?(lively?.85:1):(lively?.70:.9);
    return {kind,x,y,width,height,colour,darkColour,floor,phase:.08+((index*37+19)%100)/120,
      duration:Math.round(duration*speed),opacity:Math.min(.68,opacity*(lively?1.25:1.1)),
      drift:(left?1:-1)*(kind==="petal"?28:kind==="chinar"?20:kind==="rain"?-60:kind==="mote"?14:12)};
  });
}

// Fade the artwork itself; never paint an opaque veil over text or controls.
export const seasonFadeStops=[{at:0,strength:.1},{at:25,strength:.18},{at:55,strength:.42},{at:80,strength:.8},{at:100,strength:1}] as const;
export function seasonStrengthAt(x:number,y:number) {
  const distance=Math.min(100,Math.hypot((x-.5)*2,(y-.5)*2)/Math.SQRT2*100);
  for(let i=1;i<seasonFadeStops.length;i++){
    const previous=seasonFadeStops[i-1],next=seasonFadeStops[i];
    if(distance<=next.at)return previous.strength+(next.strength-previous.strength)*(distance-previous.at)/(next.at-previous.at);
  }
  return 1;
}
export function seasonFadeMask() {
  return `radial-gradient(ellipse at center, ${seasonFadeStops.map(stop=>`rgba(0,0,0,${stop.strength}) ${stop.at}%`).join(", ")})`;
}
export function seasonMotionEnabled(state:{enabled:boolean;reduceMotion:boolean;highContrast:boolean;active:boolean;focused:boolean;obscured?:boolean}) {
  return state.enabled&&!state.reduceMotion&&!state.highContrast&&state.active&&state.focused&&!state.obscured;
}
