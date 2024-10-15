package com.rtnbluetooth;

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class BluetoothPackage : TurboReactPackage() {
 override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
   if (name == BluetoothModule.NAME) {
     BluetoothModule(reactContext)
   } else {
     null
   }

 override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
   mapOf(
     BluetoothModule.NAME to ReactModuleInfo(
       BluetoothModule.NAME,
       BluetoothModule.NAME,
       false, // canOverrideExistingModule
       false, // needsEagerInit
       true, // hasConstants
       false, // isCxxModule
       true // isTurboModule
     )
   )
 }
}