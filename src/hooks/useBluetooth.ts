import * as ExpoDevice from 'expo-device';
import { useState, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform, NativeEventEmitter, NativeModules } from 'react-native';
import BleManager, { Peripheral } from 'react-native-ble-manager';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

interface BluetoothDevice {
  id: string;
  name: string;
}

const useBluetooth = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);

  console.log('devices: ', devices, bleManagerEmitter);
  useEffect(() => {
    BleManager.start({ showAlert: false });

    const listeners = [
      bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral),
      bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),
      bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral),
    ];

    return () => {
      listeners.forEach((listener) => listener.remove());
    };
  }, []);

  const enableBluetooth = async () => {
    BleManager.enableBluetooth()
      .then(() => {
        console.log('The bluetooth is already enabled or the user confirm');
      })
      .catch((error) => {
        console.log('The user refuse to enable bluetooth', error);
      });
  };

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
      console.log('requestPermissions');
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
        console.log('isAndroid31PermissionsGranted', isAndroid31PermissionsGranted);
        await enableBluetooth();
        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const startScan = useCallback(async () => {
    console.log('startScan');
    const hasPermission = await requestPermissions();
    console.log('hasPermission', hasPermission);
    if (!hasPermission) {
      console.log('No permissions granted');
      return;
    }

    setIsScanning(true);
    setDevices([]);

    BleManager.scan([], 5, true)
      .then(() => {
        console.log('Scanning...');
      })
      .catch((error) => {
        console.error('Scan error:', error);
        setIsScanning(false);
      });
  }, []);

  const handleStopScan = () => {
    setIsScanning(false);
    console.log('Scan stopped');
  };

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    if (peripheral.name) {
      setDevices((prevDevices) => {
        if (!prevDevices.some((device) => device.id === peripheral.id)) {
          return [...prevDevices, { id: peripheral.id, name: peripheral.name }];
        }
        return prevDevices;
      });
    }
  };

  const connectToDevice = useCallback(
    async (deviceId: string) => {
      try {
        await BleManager.connect(deviceId);
        console.log('Connected to device:', deviceId);
        const peripheralInfo = await BleManager.retrieveServices(deviceId);
        console.log('Peripheral info:', peripheralInfo);
        setConnectedDevice(devices.find((device) => device.id === deviceId) || null);
      } catch (error) {
        console.error('Connection error:', error);
      }
    },
    [devices]
  );

  const disconnectFromDevice = useCallback(async () => {
    if (connectedDevice) {
      try {
        await BleManager.disconnect(connectedDevice.id);
        console.log('Disconnected from device:', connectedDevice.id);
        setConnectedDevice(null);
      } catch (error) {
        console.error('Disconnection error:', error);
      }
    }
  }, [connectedDevice]);

  const handleDisconnectedPeripheral = (data: { peripheral: string }) => {
    console.log('Disconnected from ' + data.peripheral);
    setConnectedDevice(null);
  };

  const writeToDevice = useCallback(
    async (serviceUUID: string, characteristicUUID: string, data: string) => {
      if (!connectedDevice) {
        console.log('No device connected');
        return;
      }

      try {
        await BleManager.write(
          connectedDevice.id,
          serviceUUID,
          characteristicUUID,
          Array.from(data).map((char) => char.charCodeAt(0))
        );
        console.log('Write successful');
      } catch (error) {
        console.error('Write error:', error);
      }
    },
    [connectedDevice]
  );

  const readFromDevice = useCallback(
    async (serviceUUID: string, characteristicUUID: string) => {
      if (!connectedDevice) {
        console.log('No device connected');
        return null;
      }

      try {
        const data = await BleManager.read(connectedDevice.id, serviceUUID, characteristicUUID);
        console.log('Read successful:', data);
        return data;
      } catch (error) {
        console.error('Read error:', error);
        return null;
      }
    },
    [connectedDevice]
  );

  const startNotifications = async (
    serviceUUID: string,
    characteristicUUID: string,
    callback: (data: any) => void
  ) => {
    try {
      await BleManager.startNotification(connectedDevice?.id, serviceUUID, characteristicUUID);
      BleManager.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        ({ value, peripheral, characteristic, service }) => {
          if (
            peripheral === connectedDevice?.id &&
            characteristic === characteristicUUID &&
            service === serviceUUID
          ) {
            callback(value);
          }
        }
      );
    } catch (error) {
      console.error('Error starting notifications:', error);
      throw error;
    }
  };

  const stopNotifications = async (serviceUUID: string, characteristicUUID: string) => {
    try {
      await BleManager.stopNotification(connectedDevice?.id, serviceUUID, characteristicUUID);
    } catch (error) {
      console.error('Error stopping notifications:', error);
      throw error;
    }
  };

  return {
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
  };
};

export default useBluetooth;
