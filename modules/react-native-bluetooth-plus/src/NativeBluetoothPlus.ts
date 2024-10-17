import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  multiply(a: number, b: number): Promise<number>;
  isBluetoothEnabled(): Promise<boolean>;
  enableBluetooth(): Promise<boolean>;
  startScanning(): Promise<boolean>;
  stopScanning(): Promise<boolean>;
  connectToDevice(deviceId: string): Promise<boolean>;
  disconnectFromDevice(deviceId: string): Promise<boolean>;
  sendData(deviceId: string, data: string): Promise<boolean>;
  receiveData(deviceId: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BluetoothPlus');
