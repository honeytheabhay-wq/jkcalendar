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
  return <View style={{gap:3,paddingBottom:4}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:5}}>
      <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{width:16,height:16}}><Host style={{width:16,height:16}}><Icon name={icons[season.id]} size={14} color={colors.primaryDark} /></Host></View>
      <Text style={{color:colors.primaryDark,fontSize:12,lineHeight:17,fontWeight:"600",flexShrink:1}}>{season.name} · {season.english}</Text>
    </View>
    <Text accessibilityLanguage="ks" style={{color:colors.primaryDark,fontSize:16,lineHeight:24,writingDirection:"rtl",textAlign:"left"}}>{season.script}</Text>
    {dogri?<Text accessibilityLabel={`Dogri: ${dogri}`} style={{color:colors.muted,fontSize:12,lineHeight:18,writingDirection:"ltr"}}>{dogri}</Text>:null}
    {localMonth?<Text style={{color:colors.muted,fontSize:12,lineHeight:18,textAlign:"left",writingDirection:labelLanguage==="kashmiri"?"rtl":"ltr"}}>{localMonth}</Text>:null}
  </View>;
}
