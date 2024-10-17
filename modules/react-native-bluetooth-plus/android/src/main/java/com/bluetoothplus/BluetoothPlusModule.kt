package com.bluetoothplus

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import java.io.IOException
import java.util.UUID

class BluetoothPlusModule internal constructor(context: ReactApplicationContext) :
  BluetoothPlusSpec(context) {

  override fun getName(): String {
    return NAME
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  override fun multiply(a: Double, b: Double, promise: Promise) {
    promise.resolve(a * b)
  }

  private val bluetoothManager: BluetoothManager by lazy {
      reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
  }
  private val bluetoothAdapter: BluetoothAdapter? by lazy { bluetoothManager.adapter }
  private var isScanning = false
  private val connectedDevices = mutableMapOf<String, BluetoothSocket>()

  @ReactMethod
  override fun isBluetoothEnabled(promise: Promise) {
    Log.d(TAG, "Checking if Bluetooth is enabled")
    val isEnabled = bluetoothAdapter?.isEnabled == true
    Log.d(TAG, "Bluetooth enabled: $isEnabled")
    promise.resolve(isEnabled)
  }

  @ReactMethod
  override fun enableBluetooth(promise: Promise) {
    Log.d(TAG, "Attempting to enable Bluetooth")
    if (bluetoothAdapter == null) {
        Log.e(TAG, "Device doesn't support Bluetooth")
        promise.reject("BLUETOOTH_NOT_SUPPORTED", "Device doesn't support Bluetooth")
        return
    }

    if (bluetoothAdapter?.isEnabled == false) {
        val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
        try {
            currentActivity?.startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT)
            Log.d(TAG, "Bluetooth enable request sent")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send Bluetooth enable request", e)
            promise.reject("ENABLE_BLUETOOTH_FAILED", "Failed to send Bluetooth enable request: ${e.message}")
        }
    } else {
        Log.d(TAG, "Bluetooth is already enabled")
        promise.resolve(false)
    }
  }

  @ReactMethod
  override fun startScanning(promise: Promise) {
    Log.d(TAG, "Starting Bluetooth scan")
    if (!checkBluetoothPermissions()) {
        Log.e(TAG, "Bluetooth permissions not granted")
        promise.reject("PERMISSION_DENIED", "Bluetooth permissions not granted")
        return
    }

    if (bluetoothAdapter?.isEnabled == true) {
        isScanning = true
        bluetoothAdapter?.startDiscovery()
        Log.d(TAG, "Bluetooth discovery started")
        promise.resolve(true)
    } else {
        Log.e(TAG, "Bluetooth is not enabled")
        promise.reject("BLUETOOTH_DISABLED", "Bluetooth is not enabled")
    }
  }

  @ReactMethod
  override fun stopScanning(promise: Promise) {
    if (bluetoothAdapter?.isEnabled == true && isScanning) {
          isScanning = false
          bluetoothAdapter?.cancelDiscovery()
          promise.resolve(true)
      } else {
          promise.resolve(false)
      }
  }

  @ReactMethod
  override fun connectToDevice(deviceId: String, promise: Promise) {
    if (!checkBluetoothPermissions()) {
          promise.reject("PERMISSION_DENIED", "Bluetooth permissions not granted")
          return
      }

      val device = bluetoothAdapter?.getRemoteDevice(deviceId)
      if (device != null) {
          try {
              val socket = device.createRfcommSocketToServiceRecord(UUID.fromString("00001101-0000-1000-8000-00805F9B34FB"))
              socket.connect()
              connectedDevices[deviceId] = socket
              promise.resolve(true)
          } catch (e: IOException) {
              promise.reject("CONNECTION_FAILED", "Failed to connect to device: ${e.message}")
          }
      } else {
        promise.reject("DEVICE_NOT_FOUND", "Device not found")
    }
  }

  @ReactMethod
  override fun disconnectFromDevice(deviceId: String, promise: Promise) {
    val socket = connectedDevices[deviceId]
      if (socket != null) {
          try {
              socket.close()
              connectedDevices.remove(deviceId)
              promise.resolve(true)
          } catch (e: IOException) {
              promise.reject("DISCONNECT_FAILED", "Failed to disconnect from device: ${e.message}")
          }
      } else {
          promise.reject("DEVICE_NOT_CONNECTED", "Device is not connected")
      }
  }

  @ReactMethod
  override fun sendData(deviceId: String, data: String, promise: Promise) {
    val socket = connectedDevices[deviceId]
    if (socket != null) {
        try {
            val outputStream = socket.outputStream
            outputStream.write(data.toByteArray())
            promise.resolve(true)
        } catch (e: IOException) {
            promise.reject("SEND_FAILED", "Failed to send data: ${e.message}")
        }
    } else {
        promise.reject("DEVICE_NOT_CONNECTED", "Device is not connected")
    }
  }

  @ReactMethod
  override fun receiveData(deviceId: String, promise: Promise) {
    val socket = connectedDevices[deviceId]
    if (socket != null) {
        try {
            val inputStream = socket.inputStream
            val buffer = ByteArray(1024)
            val bytes = inputStream.read(buffer)
            val receivedData = String(buffer, 0, bytes)
            promise.resolve(receivedData)
        } catch (e: IOException) {
            promise.reject("RECEIVE_FAILED", "Failed to receive data: ${e.message}")
        }
    } else {
        promise.reject("DEVICE_NOT_CONNECTED", "Device is not connected")
    }
  }

  private fun checkBluetoothPermissions(): Boolean {
    Log.d(TAG, "Checking Bluetooth permissions")
      val hasBluetoothPermission = ContextCompat.checkSelfPermission(
          reactApplicationContext,
          android.Manifest.permission.BLUETOOTH
      ) == PackageManager.PERMISSION_GRANTED
      val hasBluetoothAdminPermission = ContextCompat.checkSelfPermission(
          reactApplicationContext,
          android.Manifest.permission.BLUETOOTH_ADMIN
      ) == PackageManager.PERMISSION_GRANTED
      val hasLocationPermission = ContextCompat.checkSelfPermission(
          reactApplicationContext,
          android.Manifest.permission.ACCESS_FINE_LOCATION
      ) == PackageManager.PERMISSION_GRANTED

      Log.d(TAG, "Bluetooth permission: $hasBluetoothPermission")
      Log.d(TAG, "Bluetooth Admin permission: $hasBluetoothAdminPermission")
      Log.d(TAG, "Location permission: $hasLocationPermission")

      return hasBluetoothPermission && hasBluetoothAdminPermission && hasLocationPermission
  }

  companion object {
    const val NAME = "BluetoothPlus"
    private const val REQUEST_ENABLE_BT = 1
    private const val TAG = "BluetoothPlusModule"
  }
}
