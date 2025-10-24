import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  root: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    position: "absolute",
    width: "60%",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    color: "white",
    overflow: "hidden",
    borderColor: "#555555ff",
    borderWidth: 1,
  },
  cardInner: {
    flex: 1,

    padding: 16,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 20, // 6–24 looks good; tweak per card size
  },
  title: { color: "white", fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: "rgba(255,255,255,0.9)" },
});
