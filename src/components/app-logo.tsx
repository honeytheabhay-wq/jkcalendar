import { Image } from "react-native";

const logo = require("../../assets/logo-chinar.png");

// The chinar-leaf app logo shown beside the title on the home screen.
export function AppLogo({ size = 46 }: { size?: number }) {
  return <Image accessibilityIgnoresInvertColors source={logo} style={{ width: size, height: size, borderRadius: size * 0.22 }} />;
}
