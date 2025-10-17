import AsyncStorage from "@react-native-async-storage/async-storage";
import reactotronZustand from "reactotron-plugin-zustand";
import Reactotron from "reactotron-react-native";
import { useGameStore } from "./lib/state";

Reactotron.setAsyncStorageHandler(AsyncStorage) // AsyncStorage would either come from `react-native` or `@react-native-community/async-storage` depending on where you get it from
  .configure({
    name: "tabletop",
  }) // controls connection & communication settings
  .useReactNative() // add all built-in react native plugins
  .use(
    //add this line 🙌
    reactotronZustand({
      stores: [{ name: "gamestore", zustand: useGameStore }],
    })
  ) // plus some custom made plugin.
  .connect(); // let's connect!
