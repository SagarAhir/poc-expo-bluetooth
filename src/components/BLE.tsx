import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import DeviceModal from './DeviceConnectionModal';
import { Colors } from '../Utils/Colors';
import useBLE from '../hooks/useBle';

const BLE = () => {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
    adjustVolume,
    togglePlayPause,
  } = useBLE();

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    console.log('isPermissionsEnabled', isPermissionsEnabled);
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.heartRateTitleWrapper}>
        {connectedDevice ? (
          <>
            <Text style={styles.heartRateText}>{`${connectedDevice.name} Connected`}</Text>
            <TouchableOpacity onPress={() => adjustVolume(true)} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Adjust Volume</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Play/Pause</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.heartRateTitleText}>Please Connect to a bluetooth device</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={connectedDevice ? disconnectFromDevice : openModal}
        style={styles.ctaButton}>
        <Text style={styles.ctaButtonText}>{connectedDevice ? 'Disconnect' : 'Connect'}</Text>
      </TouchableOpacity>
      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
        scanForDevices={scanForDevices}
      />
    </View>
  );
};

export default BLE;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heartRateTitleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartRateTitleText: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 20,
    color: Colors.secondary,
  },
  heartRateText: {
    fontSize: 25,
    marginTop: 15,
    color: Colors.secondary,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
