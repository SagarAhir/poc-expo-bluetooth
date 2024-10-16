import { Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '~/src/Utils/Colors';
import useBluetoothClassic from '~/src/hooks/useBluetoothClassic';

const DeviceListScreen: React.FC = () => {
  const router = useRouter();
  const {
    devices,
    isScanning,
    startScan,
    getBondedDevices,
    acceptConnections,
    cancelAcceptConnections,
    requestPermissions,
    disconnectFromDevice,
  } = useBluetoothClassic();
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    getBondedDevices();
  }, []);

  const handleDevicePress = useCallback(
    (device: BluetoothDevice) => {
      router.push({
        pathname: '/connectionScreen',
        params: { deviceAddress: JSON.stringify(device) },
      });
    },
    [router]
  );

  const toggleAccept = useCallback(async () => {
    if (isAccepting) {
      await cancelAcceptConnections();
      setIsAccepting(false);
    } else {
      setIsAccepting(true);
      try {
        const device = await acceptConnections();
        if (device) {
          handleDevicePress(device);
        }
      } catch (error) {
        console.log('Connection Error', error);
      } finally {
        setIsAccepting(false);
      }
    }
  }, [isAccepting, cancelAcceptConnections, acceptConnections, handleDevicePress]);

  const handleStartScan = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await requestPermissions();
      if (!granted) {
        console.log('Permission Denied');
        return;
      }
    }
    startScan();
  }, [startScan]);

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => {
    // console.log('deviceItem----> ', item);
    return (
      <View style={styles.deviceItem}>
        <TouchableOpacity style={styles.deviceInfo} onPress={() => handleDevicePress(item)}>
          <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.deviceAddress}>{item.address}</Text>
        </TouchableOpacity>
        {item?.connected && (
          <View style={styles.itemActionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDevicePress(item)}>
              <Entypo name="eye" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                disconnectFromDevice();
              }}>
              <MaterialCommunityIcons name="bluetooth-off" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bluetooth Devices</Text>

      <TouchableOpacity
        style={[styles.button, isScanning && styles.buttonDisabled]}
        onPress={handleStartScan}
        disabled={isScanning}>
        {isScanning ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Ionicons name="bluetooth" size={24} color={Colors.white} />
        )}
        <Text style={styles.buttonText}>{isScanning ? 'Scanning...' : 'Scan for Devices'}</Text>
      </TouchableOpacity>

      {Platform.OS !== 'ios' && (
        <TouchableOpacity
          style={[styles.button, isAccepting && styles.buttonDisabled]}
          onPress={toggleAccept}
          disabled={isScanning || isAccepting}>
          {isAccepting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <MaterialCommunityIcons name="bluetooth-connect" size={24} color={Colors.white} />
          )}
          <Text style={styles.buttonText}>
            {isAccepting ? 'Accepting...' : 'Accept Connection'}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.address}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>
            {isScanning ? 'Scanning for devices...' : 'No devices found'}
          </Text>
        }
      />
    </SafeAreaView>
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
  list: {
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
  deviceAddress: {
    fontSize: 12,
    color: Colors.textLight,
  },
  itemActionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: Colors.background,
  },
  emptyListText: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 16,
  },
});

export default DeviceListScreen;
