import { Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothDeviceEvent,
  BluetoothNativeDevice,
} from 'react-native-bluetooth-classic';

import Colors from '../../src/Utils/Colors';

import Update from '~/src/components/Update';
import useBluetoothClassic from '~/src/hooks/useBluetoothClassic';

interface ChatItem {
  id: number;
  message: string;
}

const BluetoothClassic = () => {
  const {
    devices,
    connectedDevice,
    isScanning,
    connecting,
    isAccepting,
    receivedData,
    startScan,
    connectToDevice,
    sendData,
    acceptConnections,
    disconnectFromDevice,
    cancelAcceptConnections,
    getConnectedDevices,
  } = useBluetoothClassic();
  const [isDeviceConnected, setIsDeviceConnected] = useState<boolean>(false);
  const [cDevice, setCDevice] = useState<BluetoothNativeDevice | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    RNBluetoothClassic.onDeviceConnected(onDeviceConnected);
  }, []);

  useEffect(() => {
    if (receivedData) {
      setChats((prevData) => [...prevData, { id: 1, message: receivedData }]);
    }
  }, [receivedData]);

  const onDeviceConnected = async (event: BluetoothDeviceEvent) => {
    console.log('event: ', event);
    setIsDeviceConnected(true);
    setCDevice(event.device);
  };

  const navigateToDetails = () => {
    setModalVisible(true);
    // router.navigate('/deviceDetails');
  };

  const [isModalVisible, setModalVisible] = useState(false);
  const [dataToSend, setDataToSend] = useState('');

  const handleConnectDevice = async (device: BluetoothDevice) => {
    const connected = await connectToDevice(device);
    if (connected) {
      setModalVisible(true);
    }
  };

  const handleSendData = async () => {
    console.log('Sending...', dataToSend);
    const result = await sendData('\n' + dataToSend);
    if (result) {
      setChats((prevData) => [...prevData, { id: 0, message: dataToSend }]);
    }
    console.log('Sent !!');
    setDataToSend('');
  };

  const handleReadData = async () => {
    try {
      console.log('Polling for available messages');
      const available = await connectedDevice?.available();
      console.log(`There is data available [${available}], attempting read`, available);

      if (available && available > 0) {
        for (let i = 0; i < available; i++) {
          console.log(`reading ${i}th time`);
          const data = await connectedDevice?.read();

          console.log(`Read data ${data}`);
          console.log(data);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const renderChatItem = ({ item, index }: { item: ChatItem; index: number }) => {
    const isSent = item.id;
    console.log('item: ', item);
    if (item.id !== 1 && item.id !== 0) return;
    return (
      <View
        key={`chatItem-${index}${item.message}${Math.random().toFixed(2)}`}
        style={isSent ? { alignSelf: 'flex-start' } : { alignSelf: 'flex-end' }}>
        <Text style={styles.receivedDataTitle}>{isSent ? 'Received' : 'Sent'}</Text>
        <View
          style={[
            styles.chatText,
            isSent ? { backgroundColor: Colors.accent } : { backgroundColor: Colors.lightTeal },
          ]}>
          <Text>{item.message}</Text>
        </View>
      </View>
    );
  };

  const renderModal = () => {
    return (
      <Modal
        visible={isModalVisible || isDeviceConnected}
        transparent
        animationType="slide"
        style={{ width: 500 }}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalWrapperContainer}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Connected Device: {connectedDevice?.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter data to send"
              value={dataToSend}
              onChangeText={setDataToSend}
              multiline
            />
            <TouchableOpacity style={styles.button} onPress={handleSendData}>
              <Text style={styles.buttonText}>Send Data</Text>
            </TouchableOpacity>
            <Text style={styles.receivedDataTitle}>Chat:</Text>
            <FlatList
              data={chats}
              keyExtractor={() => `${Math.random()}`}
              renderItem={renderChatItem}
              contentContainerStyle={{ flexGrow: 1 }}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.button}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReadData} style={styles.button}>
              <Text style={styles.closeButton}>Read</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => {
    const isConnected = item.id === connectedDevice?.id || isDeviceConnected;
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

  const renderHeader = () => {
    return (
      <View>
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
        <TouchableOpacity
          style={[styles.button, isScanning && styles.buttonDisabled]}
          onPress={isAccepting ? cancelAcceptConnections : acceptConnections}
          disabled={isScanning}>
          <Text style={styles.buttonText}>
            {isAccepting ? 'Cancel Accept Connections' : 'Accept Connections'}
          </Text>
        </TouchableOpacity>
        {!connectedDevice && (
          <TouchableOpacity
            style={[styles.button, isScanning && styles.buttonDisabled]}
            onPress={getConnectedDevices}
            disabled={isScanning}>
            <Text style={styles.buttonText}>Get Connected Devices</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Classic</Text>
      <Update />
      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.address}
        style={styles.deviceList}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>
            {isScanning ? 'Scanning for devices...' : 'No devices found'}
          </Text>
        }
      />
      {renderModal()}
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
    backgroundColor: Colors.white,
    borderRadius: 5,
    marginBottom: 15,
    padding: 20,
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
  modalWrapperContainer: {
    flex: 1,
    padding: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    padding: 25,
    backgroundColor: Colors.backgroundLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 20,
    color: Colors.white,
  },
  chatText: {
    padding: 10,
    borderRadius: 5,
  },
});

export default BluetoothClassic;
