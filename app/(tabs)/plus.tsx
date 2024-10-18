import { Ionicons } from '@expo/vector-icons';
import * as ExpoDevice from 'expo-device';
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Platform, PermissionsAndroid } from 'react-native';
import {
  connectToDevice,
  disconnectFromDevice,
  enableBluetooth,
  isBluetoothEnabled,
  receiveData,
  sendData,
  startScanning,
  stopScanning,
} from 'react-native-bluetooth-plus';

import Colors from '~/src/Utils/Colors';
import CommonButton from '~/src/components/CommonButton';

interface BluetoothDevice {
  id: string;
  name: string;
}

const BluetoothPlus = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: 'Location Permission',
        message: 'Bluetooth Low Energy requires Location',
        buttonPositive: 'OK',
      }
    );
    console.log('bluetoothScanPermission', bluetoothScanPermission);
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: 'Location Permission',
        message: 'Bluetooth Low Energy requires Location',
        buttonPositive: 'OK',
      }
    );
    console.log('bluetoothConnectPermission', bluetoothConnectPermission);
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Bluetooth Low Energy requires Location',
        buttonPositive: 'OK',
      }
    );
    console.log('fineLocationPermission', fineLocationPermission);
    return (
      bluetoothScanPermission === 'granted' &&
      bluetoothConnectPermission === 'granted' &&
      fineLocationPermission === 'granted'
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Bluetooth Low Energy requires Location',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted = await requestAndroid31Permissions();
        await checkBluetoothStatus();
        console.log('isAndroid31PermissionsGranted', isAndroid31PermissionsGranted);
        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const checkBluetoothStatus = async () => {
    try {
      const enabled = await isBluetoothEnabled();
      setIsEnabled(!!enabled);
    } catch (error) {
      console.error('Error checking Bluetooth status:', error);
    }
  };

  const handleEnableBluetooth = useCallback(async () => {
    try {
      const isEnabled = await requestPermissions();
      if (isEnabled) {
        await enableBluetooth();
        await checkBluetoothStatus();
      } else throw Error('Permissions are not enabled');
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
      const result = await startScanning();
      console.log('result: ', result);
      setDevices(result);
      // Placeholder for receiving device data
      // You might need to implement a callback mechanism in your native module

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
      await stopScanning();
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
      <Text style={styles.title}>Bluetooth Plus</Text>

      <CommonButton
        label={!isEnabled ? 'Enable Bluetooth' : isScanning ? 'Scanning...' : 'Scan for Devices'}
        iconComponent={<Ionicons name="bluetooth" size={24} color={Colors.white} />}
        onPress={isEnabled ? startScan : handleEnableBluetooth}
      />

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

export default BluetoothPlus;

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
