import { StyleSheet, View } from "react-native";

import { Colors } from "@/src/Utils/Colors";
import BLE from "@/src/components/BLE";

export default function Home() {
  return (
    <>
      <View style={styles.container}>
        <BLE />
        {/* <RFIDReader /> */}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
  },
});
