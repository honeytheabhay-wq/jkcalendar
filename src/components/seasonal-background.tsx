import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Image, StyleSheet, View } from "react-native";
import Animated, { type CSSAnimationKeyframes } from "react-native-reanimated";
import { useCalendarTheme, useSeason } from "@/theme";
import { usePreferences } from "@/utils/preferences";
import { seasonalParticles, seasonStrengthAt, seasonMotionEnabled } from "@/utils/season-effects";
import { useSeasonOverlayOpen } from "@/utils/season-motion-state";

const snowIcon=require("../../assets/season-icons/snow.png");
type Particle=ReturnType<typeof seasonalParticles>[number];

function Motif({particle:p,colour}:{particle:Particle;colour:string}) {
  const w=p.width,h=p.height;
  if(p.kind==="chinar")return <Image source={require("../../assets/season-icons/chinar.png")} style={{width:w,height:h,tintColor:colour}} />;
  if(p.kind==="petal")return <View style={{width:w,height:h,backgroundColor:colour,borderTopLeftRadius:12,borderBottomRightRadius:12,borderTopRightRadius:4,borderBottomLeftRadius:4}} />;
  // Teardrop: a square rounded on three corners, turned 45° so the sharp corner points up, with a small shine.
  if(p.kind==="rain")return <View style={{width:w,height:h,alignItems:"center",justifyContent:"flex-end"}}>
    <View style={{width:w,height:w,borderTopLeftRadius:0,borderTopRightRadius:w,borderBottomLeftRadius:w,borderBottomRightRadius:w,backgroundColor:colour,transform:[{rotate:"45deg"}]}} />
    <View style={{position:"absolute",bottom:w*.3,left:w*.28,width:w*.22,height:w*.3,borderRadius:w,backgroundColor:"#FFFFFFAA"}} />
  </View>;
  if(p.kind==="snow")return <View style={{width:w,height:h,borderRadius:w,backgroundColor:colour}} />;
  if(p.kind==="flake")return <Image source={snowIcon} style={{width:w,height:h,tintColor:colour}} />;
  if(p.kind==="mote")return <Glow width={w} height={h} colour={colour} core />;
  if(p.kind==="sparkle")return <View style={{width:w,height:h,alignItems:"center",justifyContent:"center"}}>
    <View style={{position:"absolute",width:1.6,height:h,borderRadius:1,backgroundColor:colour}} />
    <View style={{position:"absolute",width:w,height:1.6,borderRadius:1,backgroundColor:colour}} />
    <View style={{width:w*.28,height:w*.28,backgroundColor:colour,transform:[{rotate:"45deg"}]}} />
  </View>;
  return <Glow width={w} height={h} colour={colour} />; // mist and sunglow
}

// Soft light from stacked translucent ellipses: draws the same on Android, iOS and web, unlike CSS gradients.
const glowLayers=[{size:1,alpha:"22"},{size:.78,alpha:"30"},{size:.56,alpha:"44"},{size:.34,alpha:"66"}];
function Glow({width,height,colour,core=false}:{width:number;height:number;colour:string;core?:boolean}) {
  const outer=core?2.6:1;
  return <View style={{width,height,alignItems:"center",justifyContent:"center",overflow:"visible"}}>
    {glowLayers.map(layer=><View key={layer.size} style={{position:"absolute",width:width*outer*layer.size,height:height*outer*layer.size,borderRadius:Math.max(width,height)*outer,backgroundColor:`${colour}${layer.alpha}`}} />)}
    {core?<View style={{width,height,borderRadius:width,backgroundColor:colour}} />:null}
  </View>;
}

// How each effect moves over one cycle (progress 0 → 1): falling weather, rising summer motes, drifting haze, pulsing light, twinkling frost.
function frame(p:Particle,progress:number,width:number,height:number) {
  const wave=Math.sin(progress*Math.PI*2);
  let dx=0,dy=0,rotate=0,scale=1,life=Math.min(1,progress*6,(1-progress)*6);
  switch(p.kind){
    case "petal": dy=-40+progress*(height+80); dx=(progress-.5)*p.drift*5+wave*p.drift*.4; rotate=-25+progress*80; break; // diagonal drift
    case "chinar": dy=-40+progress*(height+80); dx=wave*p.drift; rotate=-25+progress*80; break;
    case "snow": dy=-20+progress*(height+40); dx=wave*p.drift*.8; break;
    case "flake": dy=-40+progress*(height+80); dx=wave*p.drift*(p.width>18?1.4:.8); rotate=(p.width>18?90:200)*progress; break;
    case "rain": dy=-60+progress*(height+120); dx=progress*p.drift*.4; life=Math.min(1,progress*10,(1-progress)*10); break;
    case "mote": dy=-progress*height*.45; dx=wave*p.drift; scale=.85+.25*(.5+.5*Math.sin(progress*Math.PI*6)); break;
    case "mist": dx=(progress-.5)*p.drift*6; break;
    case "sunglow": scale=.92+.16*Math.sin(progress*Math.PI); life=.65+.35*Math.sin(progress*Math.PI); break;
    case "sparkle": { const twinkle=Math.pow(Math.abs(Math.sin(progress*Math.PI*2)),3); life=twinkle; scale=.35+.65*twinkle; rotate=progress*45; dx=wave*4; break; }
  }
  return {dx,dy,rotate,scale,life};
}
const falls=new Set(["petal","chinar","snow","flake","rain"]);

export function SeasonalBackground({modal=false}:{modal?:boolean}) {
  const {themeName,reduceMotion,highContrast}=useCalendarTheme(),{season}=useSeason();
  const {seasonalMotion}=usePreferences();
  const obscured=useSeasonOverlayOpen();
  const [size,setSize]=useState({width:0,height:0}),[active,setActive]=useState(AppState.currentState==="active"),[focused,setFocused]=useState(false);
  const {width,height}=size;
  useEffect(()=>{const sub=AppState.addEventListener("change",state=>setActive(state==="active"));return()=>sub.remove();},[]);
  useFocusEffect(useCallback(()=>{setFocused(true);return()=>setFocused(false);},[]));
  const enabled=seasonalMotion!=="off"&&!reduceMotion&&!highContrast;
  const running=seasonMotionEnabled({enabled,reduceMotion,highContrast,active,focused,obscured:obscured&&!modal});
  // Keyframes are rebuilt only when the season, size or motion level changes, not on every screen update.
  const particles=useMemo(()=>enabled&&height>0?seasonalParticles(season.id,seasonalMotion).map((p,index)=>{
      const falling=falls.has(p.kind);
      const animationName:CSSAnimationKeyframes={};
      for(let step=0;step<=12;step++){
        const progress=step/12,{dx,dy,rotate,scale,life}=frame(p,progress,width,height);
        const x=p.x/100+(dx+p.width/2)/Math.max(width,1),y=(falling?0:p.y/100)+(dy+p.height/2)/height;
        // Faded towards the centre to keep text readable, but snow, rain and motes keep a minimum so they stay visible.
        animationName[`${progress*100}%`]={opacity:p.opacity*life*Math.max(seasonStrengthAt(x,y),p.floor),transform:[{translateY:dy},{translateX:dx},{rotate:`${rotate}deg`},{scale}]};
      }
      const colour=themeName==="midnight-indigo"?p.darkColour:p.colour;
      return <Animated.View key={`${season.id}-${seasonalMotion}-${index}`} style={{position:"absolute",left:`${p.x}%`,top:falling?0:height*p.y/100,width:p.width,height:p.height,animationName,animationDuration:p.duration,animationDelay:-p.phase*p.duration,animationIterationCount:"infinite",animationTimingFunction:"linear",animationPlayState:running?"running":"paused"}}><Motif particle={p} colour={colour} /></Animated.View>;
    }):null,[enabled,width,height,season.id,seasonalMotion,themeName,running]);
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onLayout={event=>setSize({width:event.nativeEvent.layout.width,height:event.nativeEvent.layout.height})} style={styles.layer}>
    {particles}
  </View>;
}
const styles=StyleSheet.create({layer:{...StyleSheet.absoluteFill,overflow:"hidden",zIndex:10000}});
