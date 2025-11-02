// app/index.tsx
import { Redirect } from "expo-router";
//import { Platform } from "react-native-web";
import "react-native-reanimated";
//import "react-native-get-random-values";

export default function Index() {
  return <Redirect href="/welcome" />; // or "/(tabs)/home", "/auth/login", etc.
}
