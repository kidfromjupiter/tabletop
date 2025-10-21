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
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    color: "white",
  },
  cardInner: { flex: 1 },
  title: { color: "white", fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: "rgba(255,255,255,0.9)" },
});
