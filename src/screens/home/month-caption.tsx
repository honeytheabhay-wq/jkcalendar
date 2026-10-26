import { Host, Icon } from "@expo/ui";
import { View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { useCalendarTheme } from "@/theme";
import { usePreferences } from "@/utils/preferences";
import { regionalMonthLabel } from "@/utils/regional-labels";
import { dogriSeasonLabel } from "@/utils/seasons";

const icons = {
  sonth: Icon.select({ios:"camera.macro",android:require("../../../assets/season-icons/flower.xml")}),
  grishm: Icon.select({ios:"water.waves",android:require("../../../assets/season-icons/waves.xml")}),
  wahrath: Icon.select({ios:"cloud.rain",android:require("../../../assets/season-icons/rain.xml")}),
  harud: Icon.select({ios:"leaf",android:require("../../../assets/season-icons/leaf.xml")}),
  wand: Icon.select({ios:"tree",android:require("../../../assets/season-icons/tree.xml")}),
  shishur: Icon.select({ios:"snowflake",android:require("../../../assets/season-icons/snow.xml")}),
};

export function MonthCaption({month}:{month:Date}) {
  const {season,colors}=useCalendarTheme();
  const {labelLanguage}=usePreferences();
  const localMonth=regionalMonthLabel(month,labelLanguage);
  const dogri=dogriSeasonLabel(season.id);
  // Same rows and heights for every month, so the card never jumps: name, then Kashmiri script · Dogri, then the optional regional month.
  return <View style={{gap:2}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:6,height:20}}>
      <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{width:16,height:16}}><Host style={{width:16,height:16}}><Icon name={icons[season.id]} size={14} color={colors.primaryDark} /></Host></View>
      <Text numberOfLines={1} style={{color:colors.primaryDark,fontSize:13,lineHeight:18,fontWeight:"700",flexShrink:1}}>{season.name} · {season.english}</Text>
    </View>
    <View style={{flexDirection:"row",alignItems:"center",gap:6,height:24,paddingLeft:22}}>
      <Text accessibilityLanguage="ks" numberOfLines={1} style={{color:colors.primaryDark,fontSize:15,lineHeight:22}}>{season.script}</Text>
      {dogri?<Text accessibilityLabel={`Dogri: ${dogri}`} numberOfLines={1} style={{color:colors.muted,fontSize:12,lineHeight:22,flexShrink:1}}>{`·  ${dogri}`}</Text>:null}
    </View>
    {localMonth?<View style={{height:20,paddingLeft:22,justifyContent:"center"}}><Text numberOfLines={1} style={{color:colors.muted,fontSize:12,lineHeight:18,textAlign:"left",writingDirection:labelLanguage==="kashmiri"?"rtl":"ltr"}}>{localMonth}</Text></View>:null}
  </View>;
}
