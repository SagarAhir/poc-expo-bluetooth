/* eslint-disable no-bitwise */
import { useMemo, useState, useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, Characteristic } from "react-native-ble-plx";

import * as ExpoDevice from "expo-device";

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  connectedDevice: Device | null;
  allDevices: Device[];
  togglePlayPause: () => Promise<void>;
  adjustVolume: (increase: boolean) => Promise<void>;
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const enableBluetooth = async () => {
    try {
      const isBluetoothEnabled = await bleManager.enable();
      console.log("isBluetoothEnabled", isBluetoothEnabled);
      if (!isBluetoothEnabled) {
        console.log("Failed to turn on Bluetooth");
      } else {
        console.log("Bluetooth is enabled");
      }
    } catch (e) {
      console.log("Error enabling Bluetooth", e);
    }
  };

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    console.log("bluetoothScanPermission", bluetoothScanPermission);
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    console.log("bluetoothConnectPermission", bluetoothConnectPermission);
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    console.log("fineLocationPermission", fineLocationPermission);
    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();
        console.log(
          "isAndroid31PermissionsGranted",
          isAndroid31PermissionsGranted
        );
        await enableBluetooth();
        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () => {
    console.log("scanForPeripherals");
    setAllDevices([]);
    const stopScan = () => {
      clearTimeout(scanTimeout);
      bleManager.stopDeviceScan();
      console.log("Stopped scanning for devices");
    };

    const scanTimeout = setTimeout(() => {
      stopScan();
    }, 10000);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("error start scanning", error);
        stopScan();
        return;
      }

      if (device && device.name) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  };

  const connectToDevice = async (device: Device) => {
    try {
      bleManager.stopDeviceScan();
      console.log(`Attempting to connect to device: ${device.id}`, device);
      const deviceConnection = await bleManager.connectToDevice(device.id);
      console.log(`Connected to device: ${deviceConnection.id}`);
      setConnectedDevice(deviceConnection);

      console.log("Discovering services and characteristics...");
      const result =
        await deviceConnection.discoverAllServicesAndCharacteristics();
      console.log("Services and characteristics discovered", result);

      bleManager.stopDeviceScan();
      startStreamingData(deviceConnection);
    } catch (e) {
      console.error("FAILED TO CONNECT", e);
      setConnectedDevice(null);
    }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
    }
  };

  const startStreamingData = async (device: Device) => {
    if (device) {
      console.log("startStreamingData", device);
    } else {
      console.log("No Device Connected");
    }
  };

  const verifyConnection = async (device: Device): Promise<boolean> => {
    try {
      console.log(`Verifying connection for device: ${device.id}`);
      const isConnected = await device.isConnected();
      console.log(`Device connection status: ${isConnected}`);

      if (!isConnected) {
        console.log("Device is not connected. Attempting to reconnect...");
        await connectToDevice(device);
        const reconnected = await device.isConnected();
        console.log(`Reconnection attempt result: ${reconnected}`);
        return reconnected;
      }
      return isConnected;
    } catch (error) {
      console.error("Error verifying connection:", error);
      setConnectedDevice(null);
      return false;
    }
  };

  const findAudioCharacteristic = async (
    device: Device
  ): Promise<Characteristic | null> => {
    try {
      const isConnected = await verifyConnection(device);
      if (!isConnected) {
        throw new Error("Device is not connected");
      }

      console.log("Discovering services and characteristics...");
      const services = await device.services();
      console.log(
        "Services discovered:",
        services,
        services.map((s) => s.uuid)
      );

      for (const service of services) {
        const characteristics = await service.characteristics();
        console.log(
          `Characteristics for service ${service.uuid}:`,
          characteristics.map((c) => c.uuid),
          characteristics
        );

        // Look for a characteristic that supports write without response
        const potentialAudioChar = characteristics.find(
          (char) => char.isWritableWithoutResponse
        );
        if (potentialAudioChar) {
          console.log(
            `Potential audio characteristic found: ${potentialAudioChar.uuid}`
          );
          return potentialAudioChar;
        }
      }

      console.log("No suitable characteristic found");
      return null;
    } catch (error) {
      console.error("Error finding audio characteristic:", error);
      return null;
    }
  };

  const isDeviceReady = async (): Promise<boolean> => {
    if (!connectedDevice) {
      console.log("No device connected");
      return false;
    }

    try {
      const isConnected = await verifyConnection(connectedDevice);
      if (!isConnected) {
        console.log("Device is not connected");
        return false;
      }

      // Check if we can find the audio characteristic
      const audioChar = await findAudioCharacteristic(connectedDevice);
      if (!audioChar) {
        console.log("Audio characteristic not found");
        return false;
      }

      console.log("Device is connected and ready for interaction");
      return true;
    } catch (error) {
      console.error("Error checking device readiness:", error);
      return false;
    }
  };

  const togglePlayPause = async () => {
    if (!connectedDevice) {
      console.log("No device connected");
      return;
    }

    try {
      console.log("Attempting to toggle play/pause");
      const isReady = await isDeviceReady();
      if (!isReady) {
        throw new Error("Device is not ready for interaction");
      }

      const audioChar = await findAudioCharacteristic(connectedDevice);
      if (audioChar) {
        console.log("Audio characteristic found, sending play/pause command");
        const byteArray = new Uint8Array([0x01]);
        const base64Command = btoa(String.fromCharCode.apply(null, byteArray));

        await audioChar.writeWithoutResponse(base64Command);
        console.log("Play/pause command sent successfully");
      } else {
        throw new Error("Audio characteristic not found");
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
      // You might want to handle this error in your UI
    }
  };

  const adjustVolume = async (increase: boolean) => {
    if (!connectedDevice) {
      console.log("No device connected");
      return;
    }

    try {
      console.log(
        `Attempting to adjust volume: ${increase ? "increase" : "decrease"}`
      );
      const isReady = await isDeviceReady();
      if (!isReady) {
        throw new Error("Device is not ready for interaction");
      }

      const audioChar = await findAudioCharacteristic(connectedDevice);
      if (audioChar) {
        console.log(
          "Audio characteristic found, sending volume adjustment command"
        );
        const command = increase ? 0x02 : 0x03;
        const byteArray = new Uint8Array([command]);
        const base64Command = btoa(String.fromCharCode.apply(null, byteArray));

        await audioChar.writeWithoutResponse(base64Command);
        console.log("Volume adjustment command sent successfully");
      } else {
        throw new Error("Audio characteristic not found");
      }
    } catch (error) {
      console.error("Error adjusting volume:", error);
      // You might want to handle this error in your UI
    }
  };

  useEffect(() => {
    const subscription = bleManager.onDeviceDisconnected(
      connectedDevice?.id,
      (error, device) => {
        console.log(`Device disconnected: ${device.id}`);
        if (error) {
          console.error("Disconnection error:", error);
        }
        setConnectedDevice(null);
      }
    );

    return () => subscription.remove();
  }, [connectedDevice, bleManager]);

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    disconnectFromDevice,
    allDevices,
    connectedDevice,
    togglePlayPause,
    adjustVolume,
  };
}

export default useBLE;
