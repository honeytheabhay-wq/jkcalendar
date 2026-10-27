import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Image, StyleSheet, View } from "react-native";
import Animated, { type CSSAnimationKeyframes } from "react-native-reanimated";
import { useCalendarTheme } from "@/theme";
import { usePreferences } from "@/utils/preferences";
import { seasonalParticles, seasonStrengthAt, seasonMotionEnabled } from "@/utils/season-effects";
import { useSeasonOverlayOpen } from "@/utils/season-motion-state";

const snowIcon=require("../../assets/season-icons/snow.png");
type Particle=ReturnType<typeof seasonalParticles>[number];

function Motif({particle:p,colour}:{particle:Particle;colour:string}) {
  if(p.kind==="chinar")return <Image source={require("../../assets/season-icons/chinar.png")} style={{width:p.width,height:p.height,tintColor:colour}} />;
  if(p.kind==="petal")return <View style={{width:p.width,height:p.height,backgroundColor:colour,borderTopLeftRadius:12,borderBottomRightRadius:12,borderTopRightRadius:4,borderBottomLeftRadius:4}} />;
  if(p.kind==="raindrop")return <View style={{width:p.width,height:p.height,borderRadius:4,backgroundColor:colour}} />;
  if(p.kind==="ripple")return <View style={{width:p.width,height:p.height}}>{[0,1,2].map(i=><View key={i} style={{position:"absolute",top:i*4,left:i*7,width:p.width-i*14,height:18,borderRadius:100,borderColor:colour,borderWidth:1.5}} />)}</View>;
  if(p.kind==="mist"||p.kind==="sunlight")return <View style={{width:p.width,height:p.height,experimental_backgroundImage:`radial-gradient(ellipse at center, ${colour}CC 0%, ${colour}66 40%, ${colour}00 72%)`}} />;
  return <View style={{width:p.width,height:p.height}}><Image source={snowIcon} style={{width:p.width,height:p.height,tintColor:colour}} />{p.kind==="frost"?<Image source={snowIcon} style={{position:"absolute",left:28,top:28,width:20,height:20,tintColor:colour}} />:null}</View>;
}

export function SeasonalBackground({modal=false}:{modal?:boolean}) {
  const {season,themeName,reduceMotion,highContrast}=useCalendarTheme();
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
      const falling=["petal","chinar","raindrop","snow"].includes(p.kind),turning=p.kind==="petal"||p.kind==="chinar";
      const animationName:CSSAnimationKeyframes={};
      for(let step=0;step<=12;step++){
        const progress=step/12,dy=falling?-40+progress*(height+80):0,dx=p.kind==="petal"?(progress-.5)*p.drift*5+Math.sin(progress*Math.PI*2)*p.drift*.4:falling?Math.sin(progress*Math.PI*2)*p.drift:(progress-.5)*p.drift; // petals drift diagonally, leaves and snow sway
        const x=p.x/100+(dx+p.width/2)/Math.max(width,1),y=(falling?0:p.y/100)+(dy+p.height/2)/height;
        const life=Math.min(1,progress*6,(1-progress)*6);
        animationName[`${progress*100}%`]={opacity:p.opacity*life*seasonStrengthAt(x,y),transform:[{translateY:dy},{translateX:dx},{rotate:`${turning?-25+progress*80:p.kind==="raindrop"?12:0}deg`},{scale:p.kind==="ripple"?.8+progress*.5:p.kind==="frost"?.96+progress*.04:1}]};
      }
      const colour=themeName==="midnight-indigo"?p.darkColour:p.colour;
      return <Animated.View key={`${season.id}-${seasonalMotion}-${index}`} style={{position:"absolute",left:`${p.x}%`,top:falling?0:height*p.y/100,width:p.width,height:p.height,animationName,animationDuration:p.duration,animationDelay:-p.phase*p.duration,animationIterationCount:"infinite",animationTimingFunction:"linear",animationPlayState:running?"running":"paused"}}><Motif particle={p} colour={colour} /></Animated.View>;
    }):null,[enabled,width,height,season.id,seasonalMotion,themeName,running]);
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onLayout={event=>setSize({width:event.nativeEvent.layout.width,height:event.nativeEvent.layout.height})} style={styles.layer}>
    {particles}
  </View>;
}
const styles=StyleSheet.create({layer:{...StyleSheet.absoluteFill,overflow:"hidden",zIndex:10000}});
