import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import RTNBluetooth from 'rtn-bluetooth/js/NativeBluetooth';

import Colors from '~/src/Utils/Colors';

interface BluetoothDevice {
  id: string;
  name: string;
}

const BluetoothNative = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);

  useEffect(() => {
    checkBluetoothStatus();
  }, []);

  const checkBluetoothStatus = async () => {
    try {
      const enabled = await RTNBluetooth?.isBluetoothEnabled();
      setIsEnabled(!!enabled);
    } catch (error) {
      console.error('Error checking Bluetooth status:', error);
    }
  };

  const enableBluetooth = useCallback(async () => {
    try {
      const enabled = await RTNBluetooth?.enableBluetooth();
      console.log('Bluetooth enabled:', enabled);
      setIsEnabled(!!enabled);
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
    }
  }, []);

  const startScan = useCallback(async () => {
    if (!isEnabled) {
      console.log('Bluetooth is not enabled');
      return;
    }

    setIsScanning(true);
    setDevices([]);

    try {
      await RTNBluetooth?.startScanning();
      // Implement a way to receive scan results, as the current library doesn't provide an event listener
      // This is a placeholder for where you'd handle incoming device data
      // You might need to poll for results or implement a callback mechanism in your native module

      // Stop scanning after 10 seconds
      setTimeout(() => {
        stopScan();
      }, 10000);
    } catch (error) {
      console.error('Error starting scan:', error);
      setIsScanning(false);
    }
  }, [isEnabled]);

  const stopScan = useCallback(async () => {
    try {
      await RTNBluetooth?.stopScanning();
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  }, []);

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Native</Text>

      <TouchableOpacity
        style={[styles.button, (!isEnabled || isScanning) && styles.buttonDisabled]}
        onPress={isEnabled ? startScan : enableBluetooth}>
        {isScanning ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Ionicons name="bluetooth" size={24} color={Colors.white} />
        )}
        <Text style={styles.buttonText}>
          {!isEnabled ? 'Enable Bluetooth' : isScanning ? 'Scanning...' : 'Scan for Devices'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.id}
        style={styles.deviceList}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>
            {isScanning ? 'Scanning for devices...' : 'No devices found'}
          </Text>
        }
      />
    </View>
  );
};

export default BluetoothNative;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: Colors.backgroundLight,
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  deviceId: {
    fontSize: 12,
    color: Colors.textLight,
  },
  emptyListText: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 16,
  },
});
