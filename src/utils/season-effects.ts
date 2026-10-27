import type { SeasonId } from "./seasons";

export type SeasonalMotionLevel = "off" | "subtle" | "lively";
export type SeasonalEffect = "petal" | "chinar" | "ripple" | "sunlight" | "mist" | "raindrop" | "frost" | "snow";
type Scene = {kind:string;effects:SeasonalEffect[];colour:string;darkColour:string};
export const seasonalMotionLevels = [{value:"off",label:"Off"},{value:"subtle",label:"Subtle"},{value:"lively",label:"Lively"}] as const;
export function normaliseSeasonalMotion(value:unknown,legacyEnabled:unknown=true):SeasonalMotionLevel {
  return value==="off"||value==="subtle"||value==="lively"?value:legacyEnabled===false?"off":"lively";
}
export const seasonalScenes:Record<SeasonId,Scene>={
  sonth:{kind:"petals",effects:["petal","petal","chinar","petal","petal","petal","chinar","petal"],colour:"#CB7E9B",darkColour:"#F4C0D3"},
  grishm:{kind:"lake",effects:["ripple","ripple","sunlight","sunlight","ripple","ripple"],colour:"#6BABC8",darkColour:"#B6DCF1"},
  wahrath:{kind:"mist-rain",effects:["mist","raindrop","raindrop","mist","raindrop","raindrop"],colour:"#86A996",darkColour:"#C2DECF"},
  harud:{kind:"chinar",effects:["chinar","chinar","chinar","chinar","chinar","chinar","chinar","chinar"],colour:"#BC723F",darkColour:"#EEC08C"},
  wand:{kind:"frost-haze",effects:["mist","frost","frost","mist","frost","frost"],colour:"#CCBCA6",darkColour:"#E6D7BD"},
  shishur:{kind:"snow",effects:["snow","snow","snow","snow","snow","snow","snow","snow"],colour:"#82B2D2",darkColour:"#E6F3FF"},
};

const positions=[2,88,12,76,26,64,40,54,6,82,32,69];
export function seasonalParticles(id:SeasonId,level:SeasonalMotionLevel="subtle") {
  if(level==="off")return [];
  const scene=seasonalScenes[id],lively=level==="lively";
  const fallingScene=id==="sonth"||id==="harud"||id==="shishur";
  const count=fallingScene?(lively?12:8):(lively?8:6);
  return Array.from({length:count},(_,index)=>{
    const kind=scene.effects[index%scene.effects.length];
    const left=index%2===0;
    let width=18+(index%3)*3,height=width,x=positions[index],y=0;
    let colour=scene.colour,darkColour=scene.darkColour,duration=24000+(index%3)*3200,opacity=.34;
    if(kind==="petal"){width=12+(index%3)*2;height=width*1.4;}
    if(kind==="chinar"&&id==="harud"&&index%3===1){colour="#D09949";darkColour="#F3D39D";}
    if(kind==="chinar"&&id==="sonth"){colour="#7FA57D";darkColour="#BCDEB1";width=18;height=18;}
    if(kind==="ripple"){width=86;height=28;x=left?0:74;duration=19000;opacity=.45;}
    if(kind==="sunlight"){width=130;height=32;x=left?-8:67;colour="#E2B85E";darkColour="#F3DB9F";duration=25000;opacity=.42;}
    if(kind==="mist"){width=170;height=74;x=left?-22:62;duration=29000;opacity=.42;}
    if(kind==="raindrop"){colour="#7E95A2";darkColour="#D9E5E9";width=2.5;height=14+(index%3)*4;duration=17000+(index%2)*3500;opacity=.5;}
    if(kind==="frost"){width=52;height=52;x=left?0:84;y=index<3?2:85;colour="#8EADBE";darkColour="#DDEEF7";duration=26000;opacity=.32;}
    if(kind==="snow"){if(index%3===1){colour="#ABD0E7";darkColour="#FAFDFF";}width=index===5?18:8+(index%3)*3;height=width;duration=26000+(index%4)*3100;opacity=.42;}
    const scale=lively?1.55:1.25;width*=scale;height*=scale;
    if(kind==="mist")y=8+(index*23)%78;
    if(kind==="frost")y=index%4<2?2:84;
    if(kind==="ripple"||kind==="sunlight")y=64+(index%4)*6; // bottom area, but fully on screen
    return {kind,x,y,width,height,colour,darkColour,phase:.08+((index*37+19)%100)/120,
      duration:Math.round(duration*(lively?.70:.9)),opacity:Math.min(.68,opacity*(lively?1.8:1.35)),
      drift:(left?1:-1)*(kind==="petal"?28:kind==="chinar"?20:12)};
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
