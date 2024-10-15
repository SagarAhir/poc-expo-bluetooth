package com.rtnbluetooth

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.rtnbluetooth.NativeRTNBluetoothSpec
import java.io.IOException
import java.util.*

class BluetoothModule(reactContext: ReactApplicationContext) : NativeRTNBluetoothSpec(reactContext) {

    private val bluetoothManager: BluetoothManager by lazy {
        reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    }
    private val bluetoothAdapter: BluetoothAdapter? by lazy { bluetoothManager.adapter }
    private var isScanning = false
    private val connectedDevices = mutableMapOf<String, BluetoothSocket>()

    override fun getName() = NAME

    override fun isBluetoothEnabled(promise: Promise) {
        promise.resolve(bluetoothAdapter?.isEnabled == true)
    }

    override fun enableBluetooth(promise: Promise) {
        if (bluetoothAdapter?.isEnabled == false) {
            val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
            currentActivity?.startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT)
            promise.resolve(true)
        } else {
            promise.resolve(false)
        }
    }

    override fun startScanning(promise: Promise) {
        if (!checkBluetoothPermissions()) {
            promise.reject("PERMISSION_DENIED", "Bluetooth permissions not granted")
            return
        }

        if (bluetoothAdapter?.isEnabled == true) {
            isScanning = true
            // Start discovery process
            bluetoothAdapter?.startDiscovery()
            promise.resolve(true)
        } else {
            promise.reject("BLUETOOTH_DISABLED", "Bluetooth is not enabled")
        }
    }

    override fun stopScanning(promise: Promise) {
        if (bluetoothAdapter?.isEnabled == true && isScanning) {
            isScanning = false
            bluetoothAdapter?.cancelDiscovery()
            promise.resolve(true)
        } else {
            promise.resolve(false)
        }
    }

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
        return ContextCompat.checkSelfPermission(
            reactApplicationContext,
            android.Manifest.permission.BLUETOOTH
        ) == PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(
            reactApplicationContext,
            android.Manifest.permission.BLUETOOTH_ADMIN
        ) == PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(
            reactApplicationContext,
            android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    companion object {
        const val NAME = "RTNBluetooth"
        private const val REQUEST_ENABLE_BT = 1
    }
}
