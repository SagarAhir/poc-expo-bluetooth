import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/src/Utils/Colors";
import useBluetooth from "@/src/hooks/useBluetooth";

export default function TwoScreen() {
  const {
    isScanning,
    devices,
    connectedDevice,
    startScan,
    connectToDevice,
    disconnectFromDevice,
    writeToDevice,
    readFromDevice,
    startNotifications,
    stopNotifications,
  } = useBluetooth();

  const [readData, setReadData] = useState<number[] | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);

  const serviceUUID = "01000100-0000-1000-8000-009078563412";
  const readCharacteristicUUID = "02000200-0000-1000-8000-009178563412";
  const writeCharacteristicUUID = "03000300-0000-1000-8000-009278563412";

  useEffect(() => {
    return () => {
      if (isNotifying) {
        stopNotifications(serviceUUID, readCharacteristicUUID);
      }
    };
  }, [isNotifying]);

  const handleWrite = async () => {
    try {
      const data = "Hello, OnePlus Bullets!";
      await writeToDevice(serviceUUID, writeCharacteristicUUID, data);
      Alert.alert("Success", "Data written successfully");
    } catch (error) {
      Alert.alert("Error", `Failed to write data: ${error.message}`);
    }
  };

  const handleRead = async () => {
    const serviceUUID = "01000100-0000-1000-8000-009078563412";
    const characteristicUUID = "02000200-0000-1000-8000-009178563412";

    const data = await readFromDevice(serviceUUID, characteristicUUID);
    if (data) {
      console.log("Read data:", data);
    } else {
      console.error("Failed to read characteristic");
    }
  };

  const toggleNotifications = async () => {
    try {
      if (isNotifying) {
        await stopNotifications(serviceUUID, readCharacteristicUUID);
        setIsNotifying(false);
      } else {
        await startNotifications(
          serviceUUID,
          readCharacteristicUUID,
          (data) => {
            setReadData(data);
          }
        );
        setIsNotifying(true);
      }
    } catch (error) {
      Alert.alert(
        "Notification Error",
        `Failed to toggle notifications: ${error.message}`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bluetooth Devices</Text>

      <TouchableOpacity
        style={[styles.scanButton, isScanning && styles.scanningButton]}
        onPress={startScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Ionicons name="bluetooth" size={24} color={Colors.white} />
        )}
        <Text style={styles.scanButtonText}>
          {isScanning ? "Scanning..." : "Scan for Devices"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deviceItem}
            onPress={() => connectToDevice(item.id)}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={24}
              color={Colors.text}
            />
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyListText}>No devices found</Text>
        )}
      />

      {connectedDevice && (
        <View style={styles.connectedDevice}>
          <Text style={styles.connectedTitle}>Connected Device</Text>
          <Text style={styles.connectedName}>{connectedDevice.name}</Text>
          <Text style={styles.deviceId}>ID: {connectedDevice.id}</Text>
          <Text style={styles.rssi}>RSSI: {connectedDevice.rssi}</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={disconnectFromDevice}
            >
              <Ionicons
                name="close-circle-outline"
                size={24}
                color={Colors.white}
              />
              <Text style={styles.actionButtonText}>Disconnect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleWrite}>
              <Ionicons name="pencil-outline" size={24} color={Colors.white} />
              <Text style={styles.actionButtonText}>Write Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleRead}>
              <Ionicons name="reader-outline" size={24} color={Colors.white} />
              <Text style={styles.actionButtonText}>Read Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={toggleNotifications}
            >
              <Ionicons
                name={
                  isNotifying
                    ? "notifications-off-outline"
                    : "notifications-outline"
                }
                size={24}
                color={Colors.white}
              />
              <Text style={styles.actionButtonText}>
                {isNotifying ? "Stop Notify" : "Start Notify"}
              </Text>
            </TouchableOpacity>
          </View>

          {readData && (
            <View style={styles.readDataContainer}>
              <Text style={styles.readDataTitle}>Read Data:</Text>
              <Text style={styles.readDataContent}>
                {readData instanceof Uint8Array
                  ? String.fromCharCode.apply(null, readData)
                  : JSON.stringify(readData)}
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: Colors.text,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scanningButton: {
    backgroundColor: Colors.secondary,
  },
  scanButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
  },
  deviceId: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 16,
    color: Colors.textLight,
  },
  connectedDevice: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.text,
  },
  connectedName: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  rssi: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
  },
  readDataContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
  },
  readDataTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.text,
  },
  readDataContent: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
