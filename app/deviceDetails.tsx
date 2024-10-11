import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';

import Colors from '../src/Utils/Colors';

import useBluetoothClassic from '@/src/hooks/useBluetoothClassic';

const DeviceDetails = () => {
  const router = useRouter();
  const { connectedDevice, disconnectFromDevice, sendData, receivedData } = useBluetoothClassic();
  const [message, setMessage] = React.useState('');
  const [lastCommand, setLastCommand] = React.useState('');
  const [deviceResponse, setDeviceResponse] = React.useState('');

  useEffect(() => {
    if (receivedData) {
      handleReceivedData(receivedData);
    }
  }, [receivedData]);

  const handleReceivedData = (data: string) => {
    setDeviceResponse(data);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      sendData(message);
      setLastCommand(message);
      setMessage('');
    }
  };

  const handleDisconnect = async () => {
    await disconnectFromDevice();
    router.back();
  };

  if (!connectedDevice) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.backButtonContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Connected Device</Text>
      </View>
      <Text style={styles.deviceName}>{connectedDevice.name}</Text>
      <Text style={styles.deviceAddress}>{connectedDevice.address}</Text>

      <View style={styles.messageContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textLight}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <MaterialCommunityIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Last Command:</Text>
      <Text style={styles.commandText}>{lastCommand}</Text>

      <Text style={styles.sectionTitle}>Device Response:</Text>
      <ScrollView style={styles.responseContainer}>
        <Text style={styles.responseText}>{deviceResponse}</Text>
      </ScrollView>

      <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
        <Text style={styles.disconnectButtonText}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  deviceName: {
    fontSize: 18,
    color: Colors.white,
    marginBottom: 5,
  },
  deviceAddress: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 5,
  },
  commandText: {
    color: Colors.textLight,
    marginBottom: 10,
  },
  responseContainer: {
    maxHeight: 150,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  responseText: {
    color: Colors.white,
  },
  disconnectButton: {
    backgroundColor: Colors.danger,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default DeviceDetails;
