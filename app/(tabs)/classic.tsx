import { Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BluetoothDevice } from 'react-native-bluetooth-classic';

import Colors from '../../src/Utils/Colors';

import useBluetoothClassic from '~/src/hooks/useBluetoothClassic';

const BluetoothClassic = () => {
  const {
    devices,
    connectedDevice,
    isScanning,
    connecting,
    startScan,
    connectToDevice,
    disconnectFromDevice,
  } = useBluetoothClassic();
  const router = useRouter();

  const navigateToDetails = () => {
    router.navigate('/deviceDetails');
  };

  const handleConnectDevice = async (device: BluetoothDevice) => {
    const connected = await connectToDevice(device);
    if (connected) {
      router.navigate('/deviceDetails');
    }
  };

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => {
    const isConnected = item.id === connectedDevice?.id;
    return (
      <View style={styles.deviceItem}>
        <TouchableOpacity
          style={styles.deviceInfo}
          onPress={() => (isConnected ? disconnectFromDevice() : handleConnectDevice(item))}>
          <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.deviceId}>{item.address}</Text>
        </TouchableOpacity>
        {isConnected && (
          <View style={styles.itemActionButtonsContainer}>
            <TouchableOpacity style={styles.disconnectButton} onPress={navigateToDetails}>
              <Entypo name="eye" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.disconnectButton} onPress={disconnectFromDevice}>
              <MaterialCommunityIcons name="bluetooth-off" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        {isConnected && connecting && <ActivityIndicator color={Colors.white} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Classic</Text>

      <TouchableOpacity
        style={[styles.button, isScanning && styles.buttonDisabled]}
        onPress={() => router.navigate('/deviceListScreen')}
        disabled={isScanning}>
        {isScanning ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Ionicons name="bluetooth" size={24} color={Colors.white} />
        )}
        <Text style={styles.buttonText}>{isScanning ? 'Scanning...' : 'Go To Devices'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isScanning && styles.buttonDisabled]}
        onPress={startScan}
        disabled={isScanning}>
        {isScanning ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Ionicons name="bluetooth" size={24} color={Colors.white} />
        )}
        <Text style={styles.buttonText}>{isScanning ? 'Scanning...' : 'Scan for Devices'}</Text>
      </TouchableOpacity>

      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.address}
        style={styles.deviceList}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>
            {isScanning ? 'Scanning for devices...' : 'No devices found'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: Colors.backgroundLight,
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  deviceId: {
    fontSize: 12,
    color: Colors.textLight,
  },
  emptyListText: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 16,
  },
  connectedDeviceContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: Colors.surface,
    borderRadius: 5,
  },
  connectedDeviceText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    color: Colors.backgroundLight,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  disconnectButton: {
    backgroundColor: Colors.danger,
    padding: 10,
    borderRadius: 5,
  },
  receivedDataTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  receivedDataContainer: {
    maxHeight: 150,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 5,
    padding: 10,
  },
  receivedDataText: {
    color: Colors.white,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: Colors.secondary,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: Colors.white,
    textAlign: 'center',
    fontSize: 12,
  },
  feedbackContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 5,
  },
  feedbackText: {
    color: Colors.white,
    fontSize: 12,
  },
  itemActionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
});

export default BluetoothClassic;
