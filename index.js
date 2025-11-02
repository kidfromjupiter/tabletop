if (__DEV__) {
  require("./ReactotronConfig");
}

import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import "./global.css";

// Also polyfill crypto.randomUUID so Supabase (and others) can generate stable IDs
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => uuidv4();
}
// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
