export const DPT_1bit: [string, string, string, string, string][] = [
  ["1.001", "1 bit", "DPT_Switch", "Boolean", "0 = off, 1 = on"],
  ["1.002", "1 bit", "DPT_Bool", "Boolean", "0 = false, 1 = true"],
  ["1.003", "1 bit", "DPT_Enable", "Boolean", "0 = disable, 1 = enable"],
  ["1.004", "1 bit", "DPT_Ramp", "Boolean", "0 = no ramp, 1 = ramp"],
  ["1.005", "1 bit", "DPT_Alarm", "Boolean", "0 = no alarm, 1 = alarm"],
  ["1.006", "1 bit", "DPT_BinaryValue", "Boolean", "0 = low, 1 = high"],
  ["1.007", "1 bit", "DPT_Step", "Boolean", "0 = decrease, 1 = increase"],
  ["1.008", "1 bit", "DPT_UpDown", "Boolean", "0 = up, 1 = down"],
  ["1.009", "1 bit", "DPT_OpenClose", "Boolean", "0 = open, 1 = close"],
  ["1.010", "1 bit", "DPT_Start", "Boolean", "0 = stop, 1 = start"],
  ["1.011", "1 bit", "DPT_State", "Boolean", "0 = inactive, 1 = active"],
  ["1.012", "1 bit", "DPT_Invert", "Boolean", "0 = not inverted, 1 = inverted"],
  ["1.013", "1 bit", "DPT_DimSendStyle", "Boolean", "0 = start/stop, 1 = cyclically"],
  ["1.014", "1 bit", "DPT_InputSource", "Boolean", "0 = fixed, 1 = calculated"],
  ["1.015", "1 bit", "DPT_Reset", "Boolean", "0 = no action (dummy), 1 = reset command"],
  ["1.016", "1 bit", "DPT_Ack", "Boolean", "0 = no action (dummy), 1 = acknowledge command"],
  ["1.017", "1 bit", "DPT_Trigger", "Boolean", "0, 1 = trigger"],
  ["1.018", "1 bit", "DPT_Occupancy", "Boolean", "0 = not occupied, 1 = occupied"],
  ["1.019", "1 bit", "DPT_Window_Door", "Boolean", "0 = closed, 1 = open"],
  ["1.021", "1 bit", "DPT_LogicalFunction", "Boolean", "0 = logical function OR, 1 = logical function AND"],
  ["1.022", "1 bit", "DPT_Scene_AB", "Boolean", "0 = scene A, 1 = scene B"],
  ["1.023", "1 bit", "DPT_ShutterBlinds_Mode", "Boolean", "0 = UpDown only (shutter), 1 = UpDown + StepStop (blind)"],
  ["1.024", "1 bit", "DPT_DayNight", "Boolean", "0 = day, 1 = night"],
  ["1.100", "1 bit", "DPT_Heat/Cool", "Boolean", "0 = cooling, 1 = heating"],
  ["1.1200", "1 bit", "DPT_ConsumerProducer", "Boolean", "0 = consumer, 1 = producer"],
  ["1.1201", "1 bit", "DPT_EnergyDirection", "Boolean", "0 = positive (import), 1 = negative (export)"]
];

export const DPT_2bit: [string, string, string, string, string][] = [
  ["2.001", "2 bits", "DPT_Switch_Control", "2-bit controlled", "c = {0,1}, v according to 1.001 (0=off, 1=on)"],
  ["2.002", "2 bits", "DPT_Bool_Control", "2-bit controlled", "c = {0,1}, v according to 1.002"],
  ["2.003", "2 bits", "DPT_Enable_Control", "2-bit controlled", "c = {0,1}, v according to 1.003"],
  ["2.004", "2 bits", "DPT_Ramp_Control", "2-bit controlled", "c = {0,1}, v according to 1.004"],
  ["2.005", "2 bits", "DPT_Alarm_Control", "2-bit controlled", "c = {0,1}, v according to 1.005"],
  ["2.006", "2 bits", "DPT_BinaryValue_Control", "2-bit controlled", "c = {0,1}, v according to 1.006"],
  ["2.007", "2 bits", "DPT_Step_Control", "2-bit controlled", "c = {0,1}, v according to 1.007"],
  ["2.008", "2 bits", "DPT_Direction1_Control", "2-bit controlled", "c = {0,1}, v according to 1.008"],
  ["2.009", "2 bits", "DPT_Direction2_Control", "2-bit controlled", "c = {0,1}, v according to 1.009"],
  ["2.010", "2 bits", "DPT_Start_Control", "2-bit controlled", "c = {0,1}, v according to 1.010"],
  ["2.011", "2 bits", "DPT_State_Control", "2-bit controlled", "c = {0,1}, v according to 1.011"],
  ["2.012", "2 bits", "DPT_Invert_Control", "2-bit controlled", "c = {0,1}, v according to 1.012"]
];

export const DPT_4bit: [string, string, string, string, string][] = [
  ["3.007", "4 bits", "DPT_Control_Dimming", "4-bit controlled", "c = {0,1}; StepCode = [0b000…0b111] (0=break, 1–7=step)"],
  ["3.008", "4 bits", "DPT_Control_Blinds", "4-bit controlled", "c = {0,1}; StepCode = [0b000…0b111] (0=break, 1–7=step)"]
];

export const DPT_1byte: [string, string, string, string, string][] = [
  ["4.001", "1 byte", "DPT_Char_ASCII", "Character", "[0 … 127] (ASCII, MSB always 0)"],
  ["4.002", "1 byte", "DPT_Char_8859_1", "Character", "[0 … 255] (ISO 8859-1)"],
  ["5.001", "1 byte", "DPT_Scaling", "Unsigned", "[0 … 100] % (resolution ≈ 0.4%)"],
  ["5.003", "1 byte", "DPT_Angle", "Unsigned", "[0 … 360] ° (resolution ≈ 1.4°)"],
  ["5.004", "1 byte", "DPT_Percent_U8", "Unsigned", "[0 … 255] % (resolution 1%)"],
  ["5.005", "1 byte", "DPT_DecimalFactor", "Unsigned", "[0 … 255] ratio (1 … 255 × 0.001)"],
  ["5.006", "1 byte", "DPT_Tariff", "Unsigned", "[0 … 254] (0=no tariff, 1–254=tariff value, 255=reserved)"],
  ["5.010", "1 byte", "DPT_Value_1_Ucount", "Unsigned", "[0 … 255] counter pulses"],
  ["6.001", "1 byte", "DPT_Percent_V8", "Signed", "[-128 … 127] %"],
  ["6.010", "1 byte", "DPT_Value_1_Count", "Signed", "[-128 … 127] counter pulses"],
  ["6.020", "1 byte", "DPT_Status_Mode3", "Bitfield", "A,B,C,D,E = {0,1}; Mode FFF = {001b=mode0, 010b=mode1, 100b=mode2}"]
];

export const DPT_2byte: [string, string, string, string, string][] = [
  ["7.001", "2 bytes", "DPT_Value_2_Ucount", "Unsigned", "[0 … 65535] pulses"],
  ["7.002", "2 bytes", "DPT_TimePeriodMsec", "Unsigned", "[0 … 65535] ms"],
  ["7.003", "2 bytes", "DPT_TimePeriod10MSec", "Unsigned", "[0 … 655350] ms (resolution 10 ms)"],
  ["7.004", "2 bytes", "DPT_TimePeriod100MSec", "Unsigned", "[0 … 6553500] ms (resolution 100 ms)"],
  ["7.005", "2 bytes", "DPT_TimePeriodSec", "Unsigned", "[0 … 65535] s"],
  ["7.006", "2 bytes", "DPT_TimePeriodMin", "Unsigned", "[0 … 65535] min"],
  ["7.007", "2 bytes", "DPT_TimePeriodHrs", "Unsigned", "[0 … 65535] h"],
  ["7.010", "2 bytes", "DPT_PropDataType", "Unsigned", "Interface Object Property ID [0 … 65535]"],
  ["7.011", "2 bytes", "DPT_Length_mm", "Unsigned", "[0 … 65535] mm"],
  ["7.012", "2 bytes", "DPT_UElCurrentmA", "Unsigned", "[0 … 65535] mA"],
  ["7.013", "2 bytes", "DPT_Brightness", "Unsigned", "[0 … 65535] lux"],
  ["7.600", "2 bytes", "DPT_Absolute_Colour_Temperature", "Unsigned", "[0 … 65535] K"],
  ["8.001", "2 bytes", "DPT_Value_2_Count", "Signed", "[-32768 … 32767] pulses"],
  ["8.002", "2 bytes", "DPT_DeltaTimeMsec", "Signed", "[-32768 … 32767] ms"],
  ["8.003", "2 bytes", "DPT_DeltaTime10MSec", "Signed", "[-327680 … 327670] ms"],
  ["8.004", "2 bytes", "DPT_DeltaTime100MSec", "Signed", "[-3276800 … 3276700] ms"],
  ["8.005", "2 bytes", "DPT_DeltaTimeSec", "Signed", "[-32768 … 32767] s"],
  ["8.006", "2 bytes", "DPT_DeltaTimeMin", "Signed", "[-32768 … 32767] min"],
  ["8.007", "2 bytes", "DPT_DeltaTimeHrs", "Signed", "[-32768 … 32767] h"],
  ["8.010", "2 bytes", "DPT_Percent_V16", "Signed", "[-327.68 … 327.67] %"],
  ["8.011", "2 bytes", "DPT_Rotation_Angle", "Signed", "[-32768 … 32767] °"],
  ["8.012", "2 bytes", "DPT_Length_m", "Signed", "[-32768 … 32767] m"]
];
