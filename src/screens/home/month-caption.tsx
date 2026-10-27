import { Image, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { useCalendarTheme, useSeason } from "@/theme";
import { usePreferences } from "@/utils/preferences";
import { regionalMonthLabel } from "@/utils/regional-labels";
import { dogriSeasonLabel } from "@/utils/seasons";

// Plain tinted PNGs (rendered from the vector drawables beside them) draw the same on Android, iOS and web.
const icons = {
  sonth: require("../../../assets/season-icons/flower.png"),
  grishm: require("../../../assets/season-icons/waves.png"),
  wahrath: require("../../../assets/season-icons/rain.png"),
  harud: require("../../../assets/season-icons/leaf.png"),
  wand: require("../../../assets/season-icons/tree.png"),
  shishur: require("../../../assets/season-icons/snow.png"),
};

export function MonthCaption({month}:{month:Date}) {
  const {colors}=useCalendarTheme(),{season}=useSeason();
  const {labelLanguage}=usePreferences();
  const localMonth=regionalMonthLabel(month,labelLanguage);
  const dogri=dogriSeasonLabel(season.id);
  // Same rows and heights for every month, so the card never jumps: name, then Kashmiri script · Dogri, then the optional regional month.
  return <View style={{gap:2}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:6,height:20}}>
      <Image source={icons[season.id]} accessible={false} importantForAccessibility="no" style={{width:16,height:16,tintColor:colors.primaryDark}} />
      <Text numberOfLines={1} style={{color:colors.primaryDark,fontSize:13,lineHeight:18,fontWeight:"700",flexShrink:1}}>{season.name} · {season.english}</Text>
    </View>
    <View style={{flexDirection:"row",alignItems:"center",gap:6,height:24,paddingLeft:22}}>
      <Text accessibilityLanguage="ks" numberOfLines={1} style={{color:colors.primaryDark,fontSize:15,lineHeight:22}}>{season.script}</Text>
      {dogri?<Text accessibilityLabel={`Dogri: ${dogri}`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{color:colors.muted,fontSize:12,lineHeight:22,flexShrink:1}}>{`·  ${dogri}`}</Text>:null}
    </View>
    {localMonth?<View style={{height:20,paddingLeft:22,justifyContent:"center"}}><Text numberOfLines={1} style={{color:colors.muted,fontSize:12,lineHeight:18,textAlign:"left",writingDirection:labelLanguage==="kashmiri"?"rtl":"ltr"}}>{localMonth}</Text></View>:null}
  </View>;
}
