import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  isBluetoothEnabled(): Promise<boolean>;
  enableBluetooth(): Promise<boolean>;
  startScanning(): Promise<boolean>;
  stopScanning(): Promise<boolean>;
  connectToDevice(deviceId: string): Promise<boolean>;
  disconnectFromDevice(deviceId: string): Promise<boolean>;
  sendData(deviceId: string, data: string): Promise<boolean>;
  receiveData(deviceId: string): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('RTNBluetooth') as Spec | null;
