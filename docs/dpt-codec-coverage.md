# DPT codec coverage

The workbench implements **316 exact subtypes** from KNX Interworking Datapoint Types v02.02.01 (2021), up from 24. The initial expansion added 264 codecs; owner review adds a complete-timestamp subset for 247.600 and a raw-value codec for 248.600. Coverage is not a claim of KNX certification or support for later editions.

## Scope

- Enumerations use explicit wire codes, including gaps; reserved codes are rejected. DPT 20.005 supports only standard codes 0–2, not manufacturer-specific codes 17–255.
- Integer resolution is enforced. F16, F32 and xyY scaling round to representable values. F16 `7F FF` is invalid; the largest valid positive F16 measurement is `7F FE` = 670433.28. Temperature rounding stays within subtype limits.
- F32 editors handle finite values only. Signed 64-bit energy values use decimal strings and BigInt, preserving values beyond JavaScript's safe integer range.
- Parameter-only and LTE structures can be inspected but cannot be handed off to ordinary group-value telegrams. Companion-DPT requirements are explained; this simulator does not verify a physical device's implementation.
- The existing DPT 19.001 editor remains a complete, fault-free, unsynchronised timestamp subset. DPT 16.000 remains NULL-padded ASCII without embedded NULL.
- **243.600 remains reference-only**: coordinate order is unresolved. **247.600** supports complete, fault-free, unsynchronised timestamps, hours 0–23, with CLQ and all seven reserved bits zero; other valid timestamp states are outside this editor. **248.600** supports raw-byte encoding; its KNX mapping remains pending. A conditional DALI interpretation displays raw × 2 min, with 255 meaning 510 min or longer; encoded bytes remain unchanged. Other reference-only rows still require codec implementation and service-specific validation.

## Implemented counts by family

| Family | Subtypes |
| --- | ---: |
| 1.x | 26 |
| 2.x | 12 |
| 3.x | 2 |
| 4.x | 2 |
| 5.x | 6 |
| 6.x | 2 |
| 7.x | 11 |
| 8.x | 10 |
| 9.x | 22 |
| 10.x | 1 |
| 11.x | 1 |
| 12.x | 6 |
| 13.x | 12 |
| 14.x | 83 |
| 16.x | 1 |
| 17.x | 1 |
| 18.x | 1 |
| 19.x | 1 |
| 20.x | 61 |
| 21.x | 11 |
| 23.x | 3 |
| 26.x | 1 |
| 29.x | 3 |
| 206.x | 4 |
| 221.x | 1 |
| 232.x | 1 |
| 238.x | 1 |
| 242.x | 1 |
| 244.x | 1 |
| 247.x | 1 |
| 248.x | 1 |

## This batch: exact subtypes and source pages

Printed page numbers refer to the supplied standard. The JSON manifest contains the explicit fields, allowed values, units and restrictions; the reference catalogue carries matching descriptions. Unresolved source editorial notes remain visible.

| DPT | Name | Printed pages | Ordinary group-value transfer |
| --- | --- | --- | --- |
| 1.002 | Bool | 26 | Enabled |
| 1.003 | Enable | 26 | Enabled |
| 1.004 | Ramp | 26 | Enabled |
| 1.005 | Alarm | 26 | Enabled |
| 1.006 | BinaryValue | 26 | Enabled |
| 1.007 | Step | 26 | Enabled |
| 1.008 | UpDown | 26 | Enabled |
| 1.009 | OpenClose | 26 | Enabled |
| 1.010 | Start | 26 | Enabled |
| 1.011 | State | 26 | Enabled |
| 1.012 | Invert | 26 | Enabled |
| 1.013 | DimSendStyle | 26 | Enabled |
| 1.014 | InputSource | 26 | Enabled |
| 1.015 | Reset | 26 | Enabled |
| 1.016 | Ack | 27 | Enabled |
| 1.017 | Trigger | 27 | Enabled |
| 1.018 | Occupancy | 27 | Enabled |
| 1.019 | Window_Door | 27 | Enabled |
| 1.021 | LogicalFunction | 27 | Enabled |
| 1.022 | Scene_AB | 27 | Enabled |
| 1.023 | ShutterBlinds_Mode | 27 | Enabled |
| 1.024 | DayNight | 27 | Enabled |
| 1.100 | Heat/Cool | 114 | Enabled |
| 1.1200 | ConsumerProducer | 211 | Enabled |
| 1.1201 | EnergyDirection | 211 | Enabled |
| 2.002 | Bool_Control | 28 | Enabled |
| 2.003 | Enable_Control | 28 | Enabled |
| 2.004 | Ramp_Control | 28 | Enabled |
| 2.005 | Alarm_Control | 28 | Enabled |
| 2.006 | BinaryValue_Control | 28 | Enabled |
| 2.007 | Step_Control | 28 | Enabled |
| 2.008 | Direction1_Control | 28 | Enabled |
| 2.009 | Direction2_Control | 28 | Enabled |
| 2.010 | Start_Control | 28 | Enabled |
| 2.011 | State_Control | 28 | Enabled |
| 2.012 | Invert_Control | 28 | Enabled |
| 3.008 | Control_Blinds | 30 | Enabled |
| 4.002 | Char_8859_1 | 31 | Enabled |
| 5.004 | Percent_U8 | 32 | Enabled |
| 5.005 | DecimalFactor | 32 | Enabled |
| 5.006 | Tariff | 33 | Enabled |
| 6.010 | Value_1_Count | 34 | Enabled |
| 7.002 | TimePeriodMsec | 35 | Enabled |
| 7.003 | TimePeriod10MSec | 35 | Disabled |
| 7.004 | TimePeriod100MSec | 35 | Disabled |
| 7.005 | TimePeriodSec | 35 | Enabled |
| 7.006 | TimePeriodMin | 35 | Disabled |
| 7.007 | TimePeriodHrs | 35 | Enabled |
| 7.011 | Length_mm | 36 | Enabled |
| 7.012 | UElCurrentmA | 36 | Enabled |
| 7.013 | Brightness | 36 | Disabled |
| 7.600 | Absolute_Colour_Temperature | 175 | Enabled |
| 8.002 | DeltaTimeMsec | 37 | Enabled |
| 8.003 | DeltaTime10MSec | 37 | Disabled |
| 8.004 | DeltaTime100MSec | 37 | Disabled |
| 8.005 | DeltaTimeSec | 37 | Enabled |
| 8.006 | DeltaTimeMin | 37 | Disabled |
| 8.007 | DeltaTimeHrs | 37 | Enabled |
| 8.010 | Percent_V16 | 37 | Enabled |
| 8.011 | Rotation_Angle | 38 | Enabled |
| 8.012 | Length_m | 38 | Disabled |
| 9.002 | Value_Tempd | 39 | Enabled |
| 9.003 | Value_Tempa | 39 | Enabled |
| 9.004 | Value_Lux | 39 | Enabled |
| 9.005 | Value_Wsp | 39 | Enabled |
| 9.006 | Value_Pres | 39 | Enabled |
| 9.008 | Value_AirQuality | 39 | Enabled |
| 9.009 | Value_AirFlow | 39 | Enabled |
| 9.010 | Value_Time1 | 39 | Enabled |
| 9.011 | Value_Time2 | 39 | Enabled |
| 9.020 | Value_Volt | 39 | Enabled |
| 9.021 | Value_Curr | 39 | Enabled |
| 9.022 | PowerDensity | 39 | Enabled |
| 9.023 | KelvinPerPercent | 39 | Enabled |
| 9.024 | Power | 40 | Enabled |
| 9.025 | Value_Volume_Flow | 40 | Enabled |
| 9.026 | Rain_Amount | 40 | Enabled |
| 9.027 | Value_Temp_F | 40 | Enabled |
| 9.028 | Value_Wsp_kmh | 40 | Enabled |
| 9.029 | Value_Absolute_Humidity | 40 | Enabled |
| 9.030 | Concentration_µgm3 | 40 | Enabled |
| 12.100 | LongTimePeriod_Sec | 42 | Enabled |
| 12.101 | LongTimePeriod_Min | 42 | Enabled |
| 12.102 | LongTimePeriod_Hrs | 42 | Enabled |
| 12.1200 | VolumeLiquid_Litre | 211 | Enabled |
| 12.1201 | Volume_m3 | 211 | Enabled |
| 13.002 | FlowRate_m3/h | 43 | Enabled |
| 13.010 | ActiveEnergy | 43 | Enabled |
| 13.011 | ApparantEnergy | 43 | Enabled |
| 13.012 | ReactiveEnergy | 43 | Enabled |
| 13.013 | ActiveEnergy_kWh | 43 | Enabled |
| 13.014 | ApparantEnergy_kVAh | 43 | Enabled |
| 13.015 | ReactiveEnergy_kVARh | 43 | Enabled |
| 13.016 | ActiveEnergy_MWh | 43 | Enabled |
| 13.100 | LongDeltaTimeSec | 44 | Enabled |
| 13.1200 | DeltaVolumeLiquid_Litre | 212 | Enabled |
| 13.1201 | DeltaVolume_m3 | 212 | Enabled |
| 14.001 | Value_Acceleration_Angular | 44 | Enabled |
| 14.002 | Value_Activation_Energy | 44 | Enabled |
| 14.003 | Value_Activity | 44 | Enabled |
| 14.004 | Value_Mol | 44 | Enabled |
| 14.005 | Value_Amplitude | 44 | Enabled |
| 14.006 | Value_AngleRad | 44 | Enabled |
| 14.007 | Value_AngleDeg | 44 | Enabled |
| 14.008 | Value_Angular_Momentum | 44 | Enabled |
| 14.009 | Value_Angular_Velocity | 44 | Enabled |
| 14.010 | Value_Area | 45 | Enabled |
| 14.011 | Value_Capacitance | 45 | Enabled |
| 14.012 | Value_Charge_DensitySurface | 45 | Enabled |
| 14.013 | Value_Charge_DensityVolume | 45 | Enabled |
| 14.014 | Value_Compressibility | 45 | Enabled |
| 14.015 | Value_Conductance | 45 | Enabled |
| 14.016 | Value_Electrical_Conductivity | 45 | Enabled |
| 14.017 | Value_Density | 45 | Enabled |
| 14.018 | Value_Electric_Charge | 45 | Enabled |
| 14.019 | Value_Electric_Current | 45 | Enabled |
| 14.020 | Value_Electric_CurrentDensity | 45 | Enabled |
| 14.021 | Value_Electric_DipoleMoment | 45 | Enabled |
| 14.022 | Value_Electric_Displacement | 45 | Enabled |
| 14.023 | Value_Electric_FieldStrength | 45 | Enabled |
| 14.024 | Value_Electric_Flux | 45 | Enabled |
| 14.025 | Value_Electric_FluxDensity | 45 | Enabled |
| 14.026 | Value_Electric_Polarization | 45 | Enabled |
| 14.027 | Value_Electric_Potential | 45 | Enabled |
| 14.028 | Value_Electric_PotentialDifference | 45 | Enabled |
| 14.029 | Value_ElectromagneticMoment | 45 | Enabled |
| 14.030 | Value_Electromotive_Force | 45 | Enabled |
| 14.031 | Value_Energy | 45 | Enabled |
| 14.032 | Value_Force | 45 | Enabled |
| 14.033 | Value_Frequency | 45 | Enabled |
| 14.034 | Value_Angular_Frequency | 45 | Enabled |
| 14.035 | Value_Heat_Capacity | 45 | Enabled |
| 14.036 | Value_Heat_FlowRate | 45 | Enabled |
| 14.037 | Value_Heat_Quantity | 45 | Enabled |
| 14.038 | Value_Impedance | 45 | Enabled |
| 14.039 | Value_Length | 45 | Enabled |
| 14.040 | Value_Light_Quantity | 45 | Enabled |
| 14.041 | Value_Luminance | 45 | Enabled |
| 14.042 | Value_Luminous_Flux | 45 | Enabled |
| 14.043 | Value_Luminous_Intensity | 45 | Enabled |
| 14.044 | Value_Magnetic_FieldStrength | 45 | Enabled |
| 14.045 | Value_Magnetic_Flux | 45 | Enabled |
| 14.046 | Value_Magnetic_FluxDensity | 45 | Enabled |
| 14.047 | Value_Magnetic_Moment | 45 | Enabled |
| 14.048 | Value_Magnetic_Polarization | 45 | Enabled |
| 14.049 | Value_Magnetization | 45 | Enabled |
| 14.050 | Value_MagnetomotiveForce | 45 | Enabled |
| 14.051 | Value_Mass | 46 | Enabled |
| 14.052 | Value_MassFlux | 46 | Enabled |
| 14.053 | Value_Momentum | 46 | Enabled |
| 14.054 | Value_Phase_AngleRad | 46 | Enabled |
| 14.055 | Value_Phase_AngleDeg | 46 | Enabled |
| 14.056 | Value_Power | 46 | Enabled |
| 14.057 | Value_Power_Factor | 46 | Enabled |
| 14.058 | Value_Pressure | 46 | Enabled |
| 14.059 | Value_Reactance | 46 | Enabled |
| 14.060 | Value_Resistance | 46 | Enabled |
| 14.061 | Value_Resistivity | 46 | Enabled |
| 14.062 | Value_SelfInductance | 46 | Enabled |
| 14.063 | Value_SolidAngle | 46 | Enabled |
| 14.064 | Value_Sound_Intensity | 46 | Enabled |
| 14.065 | Value_Speed | 46 | Enabled |
| 14.066 | Value_Stress | 46 | Enabled |
| 14.067 | Value_Surface_Tension | 46 | Enabled |
| 14.068 | Value_Common_Temperature | 46 | Enabled |
| 14.069 | Value_Absolute_Temperature | 46 | Enabled |
| 14.070 | Value_TemperatureDifference | 46 | Enabled |
| 14.071 | Value_Thermal_Capacity | 46 | Enabled |
| 14.072 | Value_Thermal_Conductivity | 46 | Enabled |
| 14.073 | Value_ThermoelectricPower | 46 | Enabled |
| 14.074 | Value_Time | 46 | Enabled |
| 14.075 | Value_Torque | 46 | Enabled |
| 14.076 | Value_Volume | 46 | Enabled |
| 14.077 | Value_Volume_Flux | 46 | Enabled |
| 14.078 | Value_Weight | 46 | Enabled |
| 14.079 | Value_Work | 46 | Enabled |
| 14.080 | Value_ApparentPower | 46 | Enabled |
| 14.1200 | Volume_Flux_Meter | 212 | Enabled |
| 14.1201 | Volume_Flux_ls | 212 | Enabled |
| 20.001 | SCLOMode | 53 | Enabled |
| 20.002 | BuildingMode | 53 | Enabled |
| 20.003 | OccMode | 53 | Enabled |
| 20.004 | Priority | 53 | Disabled |
| 20.005 | LightApplicationMode | 53 | Enabled |
| 20.006 | ApplicationArea | 54 | Enabled |
| 20.007 | AlarmClassType | 54 | Enabled |
| 20.008 | PSUMode | 54 | Enabled |
| 20.011 | ErrorClass_System | 55 | Enabled |
| 20.012 | ErrorClass_HVAC | 55 | Enabled |
| 20.013 | Time_Delay | 56 | Enabled |
| 20.014 | Beaufort_Wind_Force_Scale | 56 | Enabled |
| 20.017 | SensorSelect | 57 | Enabled |
| 20.020 | ActuatorConnectType | 57 | Enabled |
| 20.021 | Cloud_Cover | 57 | Enabled |
| 20.022 | PowerReturnMode | 57 | Disabled |
| 20.100 | FuelType | 115 | Enabled |
| 20.101 | BurnerType | 115 | Enabled |
| 20.103 | DHWMode | 115 | Enabled |
| 20.104 | LoadPriority | 116 | Enabled |
| 20.105 | HVACContrMode | 116 | Enabled |
| 20.106 | HVACEmergMode | 116 | Enabled |
| 20.107 | ChangeoverMode | 116 | Enabled |
| 20.108 | ValveMode | 117 | Enabled |
| 20.109 | DamperMode | 117 | Enabled |
| 20.110 | HeaterMode | 117 | Enabled |
| 20.111 | FanMode | 117 | Enabled |
| 20.112 | MasterSlaveMode | 117 | Enabled |
| 20.113 | StatusRoomSetp | 117 | Enabled |
| 20.114 | Metering_DeviceType | 118 | Enabled |
| 20.115 | HumDehumMode | 118 | Enabled |
| 20.120 | ADAType | 118 | Enabled |
| 20.121 | BackupMode | 118 | Enabled |
| 20.122 | StartSynchronization | 119 | Enabled |
| 20.600 | Behaviour_Lock_Unlock | 175 | Enabled |
| 20.601 | Behaviour_Bus_Power_Up_Down | 176 | Enabled |
| 20.602 | DALI_Fade_Time | 176 | Enabled |
| 20.603 | BlinkingMode | 176 | Enabled |
| 20.604 | LightControlMode | 176 | Enabled |
| 20.605 | SwitchPBModel | 176 | Enabled |
| 20.606 | PBAction | 176 | Enabled |
| 20.607 | DimmPBModel | 177 | Enabled |
| 20.608 | SwitchOnMode | 177 | Enabled |
| 20.609 | LoadTypeSet | 177 | Enabled |
| 20.610 | LoadTypeDetected | 178 | Enabled |
| 20.611 | Converter_Test_Control | 178 | Enabled |
| 20.612 | Converter_Control | 179 | Enabled |
| 20.613 | Converter_Data_Request | 179 | Enabled |
| 20.801 | SABExceptBehaviour | 199 | Enabled |
| 20.802 | SABBehaviour_Lock_Unlock | 199 | Enabled |
| 20.803 | SSSBMode | 199 | Enabled |
| 20.804 | BlindsControlMode | 200 | Enabled |
| 20.1200 | MBus_BreakerValve_State | 213 | Enabled |
| 20.1202 | Gas_Measurement_Condition | 213 | Enabled |
| 20.1203 | Breaker_Status | 213 | Enabled |
| 20.1204 | Euridis_Communication_Interface_Status | 213 | Enabled |
| 20.1206 | Peak_Event_Notice | 214 | Enabled |
| 20.1207 | Peak_Event | 214 | Enabled |
| 20.1208 | TIC_Type | 214 | Enabled |
| 20.1209 | Type_TIC_Channel | 214 | Enabled |
| 21.002 | Device_Control | 59 | Disabled |
| 21.100 | ForceSign | 120 | Disabled |
| 21.101 | ForceSignCool | 121 | Disabled |
| 21.102 | StatusRHC | 121 | Disabled |
| 21.103 | StatusSDHWC | 122 | Disabled |
| 21.104 | FuelTypeSet | 123 | Disabled |
| 21.105 | StatusRCC | 124 | Disabled |
| 21.106 | StatusAHU | 125 | Disabled |
| 21.601 | LightActuatorErrorInfo | 180 | Enabled |
| 21.1200 | VirtualDryContact | 214 | Enabled |
| 21.1201 | Phases_Status | 215 | Enabled |
| 23.001 | OnOff_Action | 59 | Enabled |
| 23.002 | Alarm_Reaction | 59 | Enabled |
| 23.003 | UpDown_Action | 60 | Enabled |
| 26.001 | SceneInfo | 61 | Enabled |
| 29.010 | ActiveEnergy_V64 | 67 | Enabled |
| 29.011 | ApparantEnergy_V64 | 67 | Enabled |
| 29.012 | ReactiveEnergy_V64 | 67 | Enabled |
| 206.100 | HVACModeNext | 144 | Disabled |
| 206.102 | DHWModeNext | 145 | Disabled |
| 206.104 | OccModeNext | 146 | Disabled |
| 206.105 | BuildingModeNext | 147 | Disabled |
| 238.600 | DALI_Diagnostics | 184 | Enabled |
| 242.600 | Colour_xyY | 184 | Enabled |
| 244.600 | Converter_Status | 186, 187 | Enabled |

## Owner review follow-up

PDF page images were inspected for 185, 190 and 191. The owner’s examples are regression vectors. 243.600 still has no codec. 247.600 follows the format and DPT 19.001 field reference, with the subtype-specific B1r7 final timestamp byte; no permissive SRC interpretation is assumed. 248.600 retains a source-clarification flag for the KNX gateway mapping, independently of its working raw-byte codec.

| DPT | Implementation | Printed page |
| --- | --- | --- |
| 247.600 | Complete timestamp subset, interval hours, duration seconds | 190 |
| 248.600 | Raw emergency levels, raw rated duration, named feature flags | 191 |

## Capture-analysis expansion (26 additional codecs)

The catalogue now includes the previously absent 249.600 (six-byte brightness/colour-temperature transition), bringing it to 454 entries. The 26 additions bring codec coverage to 316 subtypes. Layouts, reserved bits, sparse enumeration codes, validity masks and system/LTE transfer restrictions were checked against the source pages below. Fixed ISO 8859-1 text uses a conservative NULL-padding rule; three-phase floats support finite values only. Unresolved 243.600 remains reference-only.

| DPT | Codec | Printed source pages | Group transfer |
| --- | --- | --- | --- |
| 6.020 | Status_Mode3 | 34 | Enabled |
| 7.010 | PropDataType | 35 | Disabled: system/property/LTE scope |
| 16.001 | String_8859_1 | 48 | Enabled |
| 20.1001 | AddInfoTypes | 202 | Disabled: system/property/LTE scope |
| 20.1002 | RF_ModeSelect | 202 | Disabled: system/property/LTE scope |
| 20.1004 | Medium | 203 | Disabled: system/property/LTE scope |
| 21.001 | StatusGen | 58 | Enabled |
| 21.1000 | RF_ModeInfo | 205 | Disabled: system/property/LTE scope |
| 21.1010 | Channel_Activation_8 | 207 | Disabled: system/property/LTE scope |
| 22.1010 | Channel_Activation_16 | 208 | Disabled: system/property/LTE scope |
| 30.1010 | Channel_Activation_24 | 209 | Disabled: system/property/LTE scope |
| 22.100 | StatusDHWC | 126 | Disabled: system/property/LTE scope |
| 22.101 | StatusRHCC | 127, 128 | Enabled |
| 25.1000 | DoubleNibble | 209 | Disabled: system/property/LTE scope |
| 27.001 | CombinedInfoOnOff | 62, 63, 64 | Enabled |
| 249.600 | Brightness_Colour_Temperature_Transition | 192 | Enabled |
| 250.600 | Brightness_Colour_Temperature_Control | 193 | Enabled |
| 252.600 | Relative_Control_RGBW | 195 | Enabled |
| 253.600 | Relative_Control_xyY | 196 | Enabled |
| 254.600 | Relative_Control_RGB | 197 | Enabled |
| 251.600 | Colour_RGBW | 194 | Enabled |
| 257.1200 | Value_Electric_Current_3 | 216 | Enabled |
| 257.1201 | Value_Electric_Potential_3 | 216 | Enabled |
| 257.1202 | Value_ApparentPower_3 | 216 | Enabled |
| 272.600 | Converter_Info | 198 | Enabled |
| 276.1200 | ERL_Status | 222 | Enabled |
