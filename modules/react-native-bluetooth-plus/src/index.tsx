import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-bluetooth-plus' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const isTurboModuleEnabled = global.__turboModuleProxy != null;

const BluetoothPlusModule = isTurboModuleEnabled
  ? require('./NativeBluetoothPlus').default
  : NativeModules.BluetoothPlus;

const BluetoothPlus = BluetoothPlusModule
  ? BluetoothPlusModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function isBluetoothEnabled(): Promise<boolean> {
  return BluetoothPlus.isBluetoothEnabled();
}

export function enableBluetooth(): Promise<boolean> {
  return BluetoothPlus.enableBluetooth();
}

export function startScanning(): Promise<boolean> {
  return BluetoothPlus.startScanning();
}

export function stopScanning(): Promise<boolean> {
  return BluetoothPlus.stopScanning();
}

export function connectToDevice(deviceId: string): Promise<boolean> {
  return BluetoothPlus.connectToDevice(deviceId);
}

export function disconnectFromDevice(deviceId: string): Promise<boolean> {
  return BluetoothPlus.disconnectFromDevice(deviceId);
}

export function sendData(deviceId: string, data: string): Promise<boolean> {
  return BluetoothPlus.sendData(deviceId, data);
}

export function receiveData(deviceId: string): Promise<string> {
  return BluetoothPlus.receiveData(deviceId);
}
