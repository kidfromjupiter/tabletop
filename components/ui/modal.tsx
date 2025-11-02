import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Button } from "./button";

export default function ConfirmModal({
  visible,
  onCancel,
  onConfirm,
  title = "Leave room?",
  body = "Going back will kick you out of this room. Are you sure you want to quit?",
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  body?: string;
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalBody}>{body}</Text>

          <View style={styles.modalBtns}>
            <Button
              onPress={onCancel}
              variant="ghost"
              title="Stay"
              fullWidth={false}
            />
            <Button
              onPress={onConfirm}
              variant="danger"
              title="Leave room"
              fullWidth={false}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#121212",
    padding: 20,
    maxWidth: 600,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: "#E6E6E6",
    marginBottom: 18,
  },
  modalBtns: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
});
