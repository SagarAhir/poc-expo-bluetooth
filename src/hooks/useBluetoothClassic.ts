import * as ExpoDevice from 'expo-device';
import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';

const useBluetoothClassic = () => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [receivedData, setReceivedData] = useState<string>('');

  useEffect(() => {
    requestPermissions();
  }, []);

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
        await initializeBluetooth();
        console.log('isAndroid31PermissionsGranted', isAndroid31PermissionsGranted);
        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  // const requestPermissions = async () => {
  //   if (Platform.OS === 'android') {
  //     const granted = await PermissionsAndroid.requestMultiple([
  //       PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  //       PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  //       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  //     ]);
  //     console.log('requestPermissions granted', granted);
  //     if (
  //       granted['android.permission.BLUETOOTH_CONNECT'] !== PermissionsAndroid.RESULTS.GRANTED ||
  //       granted['android.permission.BLUETOOTH_SCAN'] !== PermissionsAndroid.RESULTS.GRANTED ||
  //       granted['android.permission.ACCESS_FINE_LOCATION'] !== PermissionsAndroid.RESULTS.GRANTED
  //     ) {
  //       console.log('Bluetooth permissions not granted');
  //     } else {
  //       initializeBluetooth();
  //     }
  //   }
  // };

  const initializeBluetooth = async () => {
    try {
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!enabled) {
        await RNBluetoothClassic.requestBluetoothEnabled();
      }
      const paired = await RNBluetoothClassic.getBondedDevices();
      setDevices(paired);
      const connected = await RNBluetoothClassic.getConnectedDevices();
      setConnectedDevice(connected[0]);
    } catch (error) {
      console.log('Error initializing Bluetooth:', error);
    }
  };

  const startScan = async () => {
    try {
      setIsScanning(true);
      setDevices([]);
      const unpaired = await RNBluetoothClassic.startDiscovery();
      const index = devices.findIndex((d) => !d.bonded);
      if (index >= 0) {
        devices.splice(index, devices.length - index, ...unpaired);
      } else {
        devices.push(...unpaired);
      }
      console.log('startScan connected', unpaired, devices);
      setDevices((prevDevices) => [...prevDevices, ...unpaired]);
    } catch (error) {
      console.log('Error starting discovery: ', error);
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      setConnecting(true);
      const connected = await RNBluetoothClassic.connectToDevice(device.address);
      console.log('connected', connected);
      const pairedDevice = await RNBluetoothClassic.pairDevice(device.address);
      console.log('pairedDevice', pairedDevice);
      if (connected) {
        setConnectedDevice(device);
        return true;
      }
    } catch (error) {
      console.log('Error connecting to device:', error);
    } finally {
      setConnecting(false);
    }
    return false;
  };

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      try {
        await RNBluetoothClassic.unpairDevice(connectedDevice.address);
        await RNBluetoothClassic.disconnectFromDevice(connectedDevice.address);
        setConnectedDevice(null);
        console.log('Disconnected from device:', connectedDevice);
      } catch (error) {
        console.log('Disconnection error:', error);
      }
    }
  };

  const sendData = useCallback(
    async (data: string) => {
      if (connectedDevice) {
        try {
          await connectedDevice.write(data);
          console.log('Data sent successfully');
        } catch (error) {
          console.error('Error sending data:', error);
        }
      } else {
        console.warn('No device connected');
      }
    },
    [connectedDevice]
  );

  const listenForData = useCallback(() => {
    if (connectedDevice) {
      connectedDevice.onDataReceived((data) => {
        setReceivedData((prevData) => prevData + data);
      });
    }
  }, [connectedDevice]);

  const getBondedDevices = useCallback(() => {
    RNBluetoothClassic.getBondedDevices().then((devices) => {
      return devices;
    });
  }, []);

  const acceptConnections = useCallback(async () => {
    const device = await RNBluetoothClassic.accept({ delimiter: '\r' });
    setConnectedDevice(device);
    return device;
  }, []);

  const cancelAcceptConnections = useCallback(async () => {
    const cancelled = await RNBluetoothClassic.cancelAccept();
    console.log('cancelled', cancelled);
  }, []);

  const getDevice = useCallback(
    (address: string) => {
      return devices.find((d) => d.address === address);
    },
    [devices]
  );

  useEffect(() => {
    if (connectedDevice) {
      listenForData();
    }
  }, [connectedDevice, listenForData]);

  return {
    devices,
    connectedDevice,
    isScanning,
    connecting,
    receivedData,
    getBondedDevices,
    requestPermissions,
    startScan,
    connectToDevice,
    disconnectFromDevice,
    sendData,
    acceptConnections,
    cancelAcceptConnections,
    getDevice,
  };
};

export default useBluetoothClassic;
