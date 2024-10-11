import BLE from "@/src/components/BLE";
import RFIDReader from "@/src/components/RFIDReader";
import { Colors } from "@/src/Utils/Colors";
import { SafeAreaView, StyleSheet } from "react-native";

const Index = () => {
  return (
    <SafeAreaView style={styles.container}>
      <BLE />
      <RFIDReader />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: 20,
  },
});

export default Index;
