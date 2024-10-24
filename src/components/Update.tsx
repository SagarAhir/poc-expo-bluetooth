import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '../Utils/Colors';

const Update = () => {
  const { isUpdateAvailable, isUpdatePending, isChecking } = Updates.useUpdates();

  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  const showDownloadButton = isUpdateAvailable;

  const updateApp = async () => {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (err) {
      console.log('Error updating app', err);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => Updates.checkForUpdateAsync()} style={styles.btnContainer}>
        {isChecking && <ActivityIndicator size={'small'} color={Colors.textLight} />}
        <Text style={styles.btnLabel}>Check manually for updates</Text>
      </TouchableOpacity>
      {showDownloadButton && (
        <TouchableOpacity onPress={updateApp} style={styles.btnContainer}>
          <Text style={styles.btnLabel}>Update Found, Tap to Update</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Update;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    borderRadius: 5,
    marginVertical: 10,
    backgroundColor: Colors.background,
  },
  btnContainer: {
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  btnLabel: {
    fontSize: 16,
    color: Colors.textLight,
  },
});
