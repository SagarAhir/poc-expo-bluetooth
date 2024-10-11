import { useState, useEffect, useMemo } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

import * as ExpoDevice from "expo-device";

const RFID_SERVICE_UUID = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
const RFID_CHARACTERISTIC_UUID = "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY";

function useRFIDReader() {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [rfidData, setRfidData] = useState<string | null>(null);

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
        const bluetoothScanPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        const fineLocationPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        await enableBluetooth();
        return (
          bluetoothScanPermission === "granted" &&
          bluetoothConnectPermission === "granted" &&
          fineLocationPermission === "granted"
        );
      }
    } else {
      return true;
    }
  };

  const scanForRFIDReaders = async () => {
    setAllDevices([]);
    const result = await requestPermissions();
    console.log("scanForRFIDReaders --Request Permissions Result:", result);

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
        console.log("Error while scanning:", error);
        return;
      }
      console.log("device", device);
      if (device && device.name && device.name.includes("RFID")) {
        setAllDevices((prevDevices) => {
          if (!prevDevices.some((d) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });
  };

  const discoverServicesAndCharacteristics = async (device: Device) => {
    const services = await device.services();
    services.forEach(async (service) => {
      console.log("Service:", service.uuid);
      const characteristics = await service.characteristics();
      characteristics.forEach((characteristic) => {
        console.log("Characteristic:", characteristic.uuid);
      });
    });
  };

  const connectToRFIDReader = async (device: Device) => {
    try {
      bleManager.stopDeviceScan();
      const connected = await bleManager.connectToDevice(device.id);
      setConnectedDevice(connected);
      await discoverServicesAndCharacteristics(connected);
      console.log("Connected to RFID Reader:", connected.id);

      readRFIDData(connected);
    } catch (error) {
      console.error("Error connecting to device:", error);
    }
  };

  const readRFIDData = async (device: Device) => {
    try {
      const services = await device.services();
      const rfidService = services.find(
        (service) => service.uuid === RFID_SERVICE_UUID
      );
      if (!rfidService) {
        console.log("RFID service not found");
        return;
      }

      const characteristics = await rfidService.characteristics();
      const rfidCharacteristic = characteristics.find(
        (char) => char.uuid === RFID_CHARACTERISTIC_UUID
      );
      if (!rfidCharacteristic) {
        console.log("RFID characteristic not found");
        return;
      }

      rfidCharacteristic.monitor((error, characteristic) => {
        if (error) {
          console.log("Error reading characteristic:", error);
          return;
        }
        if (characteristic?.value) {
          const rfidTag = Buffer.from(
            characteristic.value,
            "base64"
          ).toString();
          setRfidData(rfidTag);
          console.log("RFID Tag Scanned:", rfidTag);
        }
      });
    } catch (error) {
      console.error("Error reading RFID data:", error);
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  return {
    requestPermissions,
    scanForRFIDReaders,
    connectToRFIDReader,
    allDevices,
    connectedDevice,
    rfidData,
    bleManager,
  };
}

export default useRFIDReader;
