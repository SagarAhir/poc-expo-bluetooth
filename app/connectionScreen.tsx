import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '~/src/Utils/Colors';
import CommonButton from '~/src/components/CommonButton';
import useBluetoothClassic from '~/src/hooks/useBluetoothClassic';

interface Message {
  data: string;
  timestamp: Date;
  type: 'error' | 'info' | 'receive' | 'sent';
}

const ConnectionScreen: React.FC = () => {
  const { deviceAddress } = useLocalSearchParams<{ deviceAddress: any }>();
  const [text, setText] = useState<string>('');
  const [data, setData] = useState<Message[]>([]);
  const router = useRouter();
  const {
    connectedDevice,
    connectToDevice,
    disconnectFromDevice,
    sendData: sendBluetoothData,
  } = useBluetoothClassic();

  const parsedDeviceAddress = JSON.parse(deviceAddress);

  useEffect(() => {
    if (!connectedDevice) {
      connectToDevice(parsedDeviceAddress);
    }
    return () => {
      if (connectedDevice) {
        disconnectFromDevice();
      }
    };
  }, []);

  const addData = useCallback((message: Message) => {
    setData((prevData) => [message, ...prevData]);
  }, []);

  const sendData = useCallback(async () => {
    if (connectedDevice) {
      try {
        await sendBluetoothData(text);
        addData({
          timestamp: new Date(),
          data: text,
          type: 'sent',
        });
        setText('');
      } catch (error) {
        console.log(error);
        addData({
          timestamp: new Date(),
          data: `Send failed: ${error?.message}`,
          type: 'error',
        });
      }
    }
  }, [connectedDevice, text, sendBluetoothData]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{parsedDeviceAddress?.name || 'Unknown Device'}</Text>
        <CommonButton
          onPress={
            connectedDevice ? disconnectFromDevice : () => connectToDevice(parsedDeviceAddress)
          }
          label={connectedDevice ? 'Disconnect' : 'Connect'}
        />
      </View>
      <View style={styles.content}>
        <FlatList
          style={styles.output}
          contentContainerStyle={{ justifyContent: 'flex-end' }}
          inverted
          data={data}
          keyExtractor={(item) => item.timestamp.toISOString()}
          renderItem={({ item }) => (
            <View style={styles.messageRow}>
              <Text>{item.timestamp.toLocaleDateString()}</Text>
              <Text>{item.type === 'sent' ? ' < ' : ' > '}</Text>
              <Text style={styles.messageText}>{item.data.trim()}</Text>
            </View>
          )}
        />
        <View style={[styles.inputArea, connectedDevice && styles.inputAreaConnected]}>
          <TextInput
            style={styles.input}
            placeholder="Command/Text"
            value={text}
            onChangeText={setText}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={sendData}
            returnKeyType="send"
            editable={!!connectedDevice}
          />
          <TouchableOpacity onPress={sendData} disabled={!connectedDevice}>
            <Text>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  output: {
    flex: 1,
    padding: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  messageText: {
    flexShrink: 1,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    padding: 8,
  },
  inputAreaConnected: {
    backgroundColor: Colors.success,
  },
  input: {
    flex: 1,
    height: 40,
    marginRight: 8,
    paddingHorizontal: 8,
    backgroundColor: Colors.white,
    borderRadius: 4,
  },
});

export default ConnectionScreen;
