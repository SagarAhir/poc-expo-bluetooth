import React, { useEffect, useState } from "react";
import { PermissionsAndroid, View, Text, Button } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

const Device2Device = () => {
  const [manager] = useState(new BleManager());
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    requestLocationPermission();

    return () => {
      manager.destroy();
    };
  }, [manager]);

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app needs access to your location to use Bluetooth.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Location permission granted");
      } else {
        console.log("Location permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const scanDevices = () => {
    setDevices([]);
    let timer: NodeJS.Timeout;
    const stopScan = () => {
      clearTimeout(timer);
      manager.stopDeviceScan();
    };

    manager.startDeviceScan(null, null, (error, device) => {
      timer = setTimeout(stopScan, 10000);
      if (error) {
        console.warn(error);
        return;
      }

      if (device) {
        setDevices((prevDevices: Device[]) => {
          if (!prevDevices.find((d) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });
  };

  const connectToDevice = async (device: Device) => {
    try {
      const connectedDevice = await manager.connectToDevice(device.id);
      console.log("Connected to device:", connectedDevice);

      // You can discover services and characteristics here
      const services =
        await manager.discoverAllServicesAndCharacteristicsForDevice(device.id);
      console.log("Discovered services:", services);

      // Send data (to a specific characteristic)
      const characteristicUUID = "YOUR_CHARACTERISTIC_UUID";
      const dataToSend = new Uint8Array([0x01, 0x02, 0x03]); // Example data
      await manager.writeCharacteristicWithResponseForDevice(
        device.id,
        characteristicUUID,
        dataToSend
      );
    } catch (error) {
      console.warn("Connection failed", error);
    }
  };

  return (
    <View>
      <Button title="Scan for Devices" onPress={scanDevices} />
      {devices.map((device) => (
        <View key={device.id}>
          <Text>{device.name || "Unnamed Device"}</Text>
          <Button title="Connect" onPress={() => connectToDevice(device)} />
        </View>
      ))}
    </View>
  );
};

export default Device2Device;
