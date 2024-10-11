import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import CommonButton from './CommonButton';
import { Colors } from '../Utils/Colors';
import useRFIDReader from '../hooks/useRFIDReader';

const RFIDReader: React.FC = () => {
  const {
    requestPermissions,
    scanForRFIDReaders,
    connectToRFIDReader,
    allDevices,
    connectedDevice,
    rfidData,
    bleManager,
  } = useRFIDReader();

  useEffect(() => {
    handleRequestPermissions();
    console.log('Connected Device:', connectedDevice);
  }, []);

  const handleRequestPermissions = async () => {
    const result = await requestPermissions();
    console.log('Request Permissions Result:', result);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>RFID Reader</Text>

      {connectedDevice ? (
        <>
          <Text style={styles.text}>{`Connected to: ${
            connectedDevice.name || 'Unnamed Device'
          }`}</Text>
          <Text style={styles.text}>{`RFID Data: ${rfidData || 'No data yet'}`}</Text>
          <CommonButton
            label="Disconnect"
            onPress={() => bleManager.cancelDeviceConnection(connectedDevice.id)}
          />
        </>
      ) : (
        <>
          <CommonButton label="Scan for RFID Readers" onPress={scanForRFIDReaders} />
          <View style={styles.deviceList}>
            {allDevices.map((device) => (
              <CommonButton
                key={device.id}
                label={device.name || 'Unnamed Device'}
                onPress={() => connectToRFIDReader(device)}
              />
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: Colors.white,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: Colors.secondary,
  },
  deviceList: {
    marginTop: 10,
  },
});

export default RFIDReader;
