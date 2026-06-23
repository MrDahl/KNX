import { APCICode, APCIDefinition, DPTDefinition, QuizQuestion, KNXAddressIndividual, KNXAddressGroup } from "./types";

export const APCI_DEFS: APCIDefinition[] = [
  {
    code: APCICode.GroupValueRead,
    name: "GroupValueRead (0000)",
    description: "Reads the value of a group object(s) linked to a particular group address. Transmitted connectionless to a group (multicast).",
    isManagement: false,
  },
  {
    code: APCICode.GroupValueResponse,
    name: "GroupValueResponse (0001)",
    description: "Reply to a GroupValueRead request. Re-transmits the state of the sender's corresponding group object.",
    isManagement: false,
  },
  {
    code: APCICode.GroupValueWrite,
    name: "GroupValueWrite (0010)",
    description: "Writes a new value directly to a group object. The standard operational payload exchanged between sensors (e.g. wall pushbuttons) and actuators (e.g. relay modules).",
    isManagement: false,
  },
  {
    code: APCICode.PhysAddrWrite,
    name: "PhysAddrWrite (0011)",
    description: "Assigns a new physical (individual) address to any device currently set in programming mode. Broadcast to destination address 0/0/0.",
    isManagement: true,
  },
  {
    code: APCICode.PhysAddrRead,
    name: "PhysAddrRead (0100)",
    description: "Polls the bus for the physical address of any device that currently has its programming LED activated. Destination is 0/0/0.",
    isManagement: true,
  },
  {
    code: APCICode.PhysAddrResponse,
    name: "PhysAddrResponse (0101)",
    description: "Response sent by a device in programming mode to report its physical address back to ETS.",
    isManagement: true,
  },
  {
    code: APCICode.AdcRead,
    name: "AdcRead (0110)",
    description: "Requests the addressed device to conduct an Analogue-to-Digital conversion and return the sum.",
    isManagement: true,
  },
  {
    code: APCICode.AdcResponse,
    name: "AdcResponse (0111)",
    description: "Contains the 2-byte result of the requested Analogue-to-Digital conversion.",
    isManagement: true,
  },
  {
    code: APCICode.MemoryRead,
    name: "MemoryRead (1000)",
    description: "Requests the device to read and return a specified block of bytes from its internal memory (EEPROM/Flash). Used during ETS configuration downloads.",
    isManagement: true,
  },
  {
    code: APCICode.MemoryResponse,
    name: "MemoryResponse (1001)",
    description: "Returns the binary dump of requested memory bytes to the commissioning controller.",
    isManagement: true,
  },
  {
    code: APCICode.MemoryWrite,
    name: "MemoryWrite (1010)",
    description: "Instructs the device to flash a block of bytes directly to memory. Typically requires a point-to-point secure Transport Layer session.",
    isManagement: true,
  },
  {
    code: APCICode.UserMessage,
    name: "UserMessage (1011)",
    description: "Specialized frame initiating data exchange directly between microcontroller chips inside a KNX device.",
    isManagement: true,
  },
  {
    code: APCICode.DeviceDescriptorRead,
    name: "DeviceDescriptorRead (1100)",
    description: "Polls a target device for its mask and hardware platform version (e.g. System 7, System B).",
    isManagement: true,
  },
  {
    code: APCICode.DeviceDescriptorResponse,
    name: "DeviceDescriptorResponse (1101)",
    description: "Returns the device profile descriptor block indicating transceiver type, processor mask, and application profile limitations.",
    isManagement: true,
  },
  {
    code: APCICode.Restart,
    name: "Restart (1110)",
    description: "Instructs a device to perform a hardware reboot. It restarts both its operating system and the local ETS application program.",
    isManagement: true,
  },
  {
    code: APCICode.Escape,
    name: "Escape (1111)",
    description: "Escape sequence for extended APCI service byte structures.",
    isManagement: true,
  },
];

export const DPT_DEFS: DPTDefinition[] = [
  {
    id: "1",
    name: "DPT 1.xxx (1-bit / Switching/Boolean)",
    sizeBits: 1,
    description: "Simplest binary control data. Represents On/Off, Up/Down, Start/Stop, Enable/Disable, or Open/Close settings.",
    exampleValues: [
      { value: "On", display: "On (1)", binary: "1" },
      { value: "Off", display: "Off (0)", binary: "0" },
    ],
  },
  {
    id: "2",
    name: "DPT 2.xxx (2-bit / Priority Control)",
    sizeBits: 2,
    description: "Usually used for prioritized override commands (with forced control state). Bit 0 is state, Bit 1 activates override.",
    exampleValues: [
      { value: "Forced On", display: "Forced On (11)", binary: "11" },
      { value: "Forced Off", display: "Forced Off (10)", binary: "10" },
      { value: "No Override", display: "Deactivated Priority (00)", binary: "00" },
    ],
  },
  {
    id: "3",
    name: "DPT 3.xxx (4-bit / Dimming Control)",
    sizeBits: 4,
    description: "Transmits dimming direction (Up=1/Down=0) paired with step code (e.g. increase by 25%).",
    exampleValues: [
      { value: "Dim Up 100%", display: "Dim Up (Step 100%)", binary: "1001" },
      { value: "Dim Down 25%", display: "Dim Down (Step 25%)", binary: "0011" },
      { value: "Stop", display: "Stop Dimming", binary: "0000" },
    ],
  },
  {
    id: "5",
    name: "DPT 5.001 (8-bit / Scaling Percentage)",
    sizeBits: 8,
    description: "Unsigned 1-byte value mapped linearly from 0-100% represents temperature, level, dimming slider (0 corresponds to 0, 255 to 100%).",
    exampleValues: [
      { value: "50%", display: "50% (Dec 128)", binary: "10000000" },
      { value: "100%", display: "100% (Dec 255)", binary: "11111111" },
      { value: "13%", display: "13% (Dec 33)", binary: "00100001" },
    ],
  },
  {
    id: "6",
    name: "DPT 6.xxx (8-bit / Signed Percent/Relative Value)",
    sizeBits: 8,
    description: "Signed 1-byte relative offset/offset percentage value ranging from -128% to +127%. Used for fan offsets, angle trims, or HVAC control adjustments.",
    exampleValues: [
      { value: "50%", display: "+50% (Dec 50)", binary: "00110010" },
      { value: "-25%", display: "-25% (Dec -25)", binary: "11100111" },
    ],
  },
  {
    id: "7",
    name: "DPT 7.xxx (2-byte / 16-bit Unsigned Integer)",
    sizeBits: 16,
    description: "Standard counter, pulse counts, time intervals (msec, min, hours) or generic magnitude measurements between 0 and 65,535.",
    exampleValues: [
      { value: "450", display: "Count 450", binary: "0000000111000010" },
      { value: "1200", display: "Count 1200", binary: "0000010010110000" },
    ],
  },
  {
    id: "8",
    name: "DPT 8.xxx (2-byte / 16-bit Signed Integer)",
    sizeBits: 16,
    description: "Signed 2-byte value from -32,768 to 32,767 representing delta temperature, altitude, relative angles, or length differences.",
    exampleValues: [
      { value: "-1500", display: "-1500 meters", binary: "1111101000100100" },
      { value: "480", display: "+480 pulses", binary: "0000000111100000" },
    ],
  },
  {
    id: "9",
    name: "DPT 9.001 (2-byte / 16-bit float / Temperature)",
    sizeBits: 16,
    description: "KNX-specific 2-byte float representing temperature values, using a 1-bit sign, 4-bit exponent, and 11-bit mantissa.",
    exampleValues: [
      { value: "21.0", display: "21.0 °C", binary: "0001010001001010" },
      { value: "23.5", display: "23.5 °C", binary: "0001010001111011" },
    ],
  },
  {
    id: "10",
    name: "DPT 10.001 (3-byte / Date)",
    sizeBits: 24,
    description: "Packs Day of Week, Day of Month, Month, and Year into 24 bits.",
    exampleValues: [
      { value: "Today", display: "Standard Date Block", binary: "001000110000011000011010" },
    ],
  },
  {
    id: "12",
    name: "DPT 12.xxx (4-byte / 32-bit Unsigned Value)",
    sizeBits: 32,
    description: "Unsigned 4-byte high capacity counter ranging from 0 to 4,294,967,295 for fluid volume, gas volume, or energy meters.",
    exampleValues: [
      { value: "1250000", display: "1,250,000 Liters", binary: "00000000000100110001001011010000" },
    ],
  },
  {
    id: "13",
    name: "DPT 13.xxx (4-byte / 32-bit Signed Value / Active Energy)",
    sizeBits: 32,
    description: "Signed 4-byte counter from -2.14B to +2.14B typically counting active electrical energy consumption in Wh or Wh pulses.",
    exampleValues: [
      { value: "850024", display: "850,024 Wh", binary: "00000000000011001111100001101000" },
    ],
  },
  {
    id: "14",
    name: "DPT 14.xxx (4-byte / 32-bit Single Precision Float)",
    sizeBits: 32,
    description: "IEEE 754 float represent generic electrical parameters, volume, power draw, or high-accuracy floats.",
    exampleValues: [
      { value: "1500.5", display: "1500.5 (Watt/etc.)", binary: "01000100101110111001000000000000" },
    ],
  },
  {
    id: "16",
    name: "DPT 16.xxx (14-byte / ASCII Text)",
    sizeBits: 112,
    description: "14 character positions encoded as string values inside APDU packet lines.",
    exampleValues: [
      { value: "KNX TP1 ACTIVE", display: "text 'KNX TP1 ACTIVE'", binary: "0100101101001110010110000010000001010100010100000011000100100000010000010100001101010100010010010101011001000101" },
    ],
  },
  {
    id: "19",
    name: "DPT 19.001 (8-byte / 64-bit Date and Time)",
    sizeBits: 64,
    description: "Packs Year (offset 1900), Month, Day, Day of Week, Hour, Minute, Second, and execution status attributes into 8 bytes.",
    exampleValues: [
      { value: "2026-06-23 12:00:00", display: "June 23, 2026 12:00:00 Tuesday", binary: "0111111000000110000101110010110000001100000000000000000000000000" },
    ],
  },
  {
    id: "232",
    name: "DPT 232.600 (3-byte / 24-bit RGB Colour Control)",
    sizeBits: 24,
    description: "Packs Red, Green, and Blue intensity channels as three distinct 8-bit octets into 3 bytes total. Beautiful for full-spectrum ambient setups.",
    exampleValues: [
      { value: "RGB(79, 70, 229)", display: "Indigo (4Fh 46h E5h)", binary: "010011110100011011100101" },
    ],
  },
  {
    id: "256",
    name: "DPT 256.001 (16-byte / 128-bit DateTime Period / Download Block)",
    sizeBits: 128,
    description: "Highly robust DPT packing both Start and Stop DateTime blocks. Commonly used as the core data format for scheduler automation and device firmware/configuration download blocks. Takes exactly ~40.2ms of active transit time on a 9600 bps Twisted Pair line.",
    exampleValues: [
      { value: "Download Block Data", display: "16-byte binary stream (firmware block)", binary: "101010101010101011110000111100000101010101010101110011001100110000110011001100111100110011001100111111110000000001010101111111110000111100001111010101010101010111001100110011001111000011110000" },
    ],
  }
];

/**
 * Encodes a numeric value into the 2-Byte KNX Float configuration.
 * Formula: Value = (0.01 * Mantissa) * 2^Exponent
 */
export function encodeKnxFloat(val: number): string {
  let mantissa = Math.round(val * 100);
  let exponent = 0;
  
  while (mantissa < -2048 || mantissa > 2047) {
    mantissa = Math.round(mantissa / 2);
    exponent++;
    if (exponent > 15) {
      mantissa = val > 0 ? 2047 : -2048;
      exponent = 15;
      break;
    }
  }
  
  const sign = mantissa < 0 ? 1 : 0;
  // Compute standard 2's complement of 11-bit mantissa if negative
  let mVal = mantissa;
  if (sign === 1) {
    mVal = (1 << 11) + mantissa;
  }
  
  const binSign = sign.toString(2);
  const binExp = exponent.toString(2).padStart(4, "0");
  const binMant = mVal.toString(2).padStart(11, "0").slice(-11);
  
  return binSign + binExp + binMant;
}

export function decodeKnxFloat(bin: string): number {
  if (bin.length !== 16) return 0;
  const sign = parseInt(bin[0], 2);
  const exp = parseInt(bin.substring(1, 5), 2);
  let mantissa = parseInt(bin.substring(5), 2);
  
  // If native bit sign is high, resolve negative the 11-bit range
  if (sign === 1) {
    mantissa = mantissa - (1 << 11);
  }
  
  return Math.round((0.01 * mantissa * Math.pow(2, exp)) * 100) / 100;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "On a KNX Twisted Pair (TP1) line, how is a logical '0' represented physically?",
    options: [
      "As a steady high voltage level of 29V DC.",
      "As a negative phase shift in an alternating carrier wave.",
      "As an active signal consisting of a voltage drop of 5-10V for 35µs, followed by an overshoot.",
      "As an electric current pulse of 100mA spikes lasting 104µs."
    ],
    correctIndex: 2,
    explanation: "Excellent! On the KNX TP1 physical layer, a logical '1' is passive (idle bus voltage remains at ~29V), whilst a logical '0' is active, resulting in a brief voltage drop of 5-10V (t_active of ~35µs) followed by a choke-induced positive overshoot."
  },
  {
    id: 2,
    question: "At a standard KNX TP1 baud rate of 9600 bps, how long does one bit-period occupy the bus?",
    options: [
      "10.4 milliseconds",
      "104 microseconds",
      "1.35 milliseconds",
      "15.6 milliseconds"
    ],
    correctIndex: 1,
    explanation: "Correct! Since the transmission rate is precisely 9600 bit/sec, the duration of a single bit is 1/9600 s, which yields exactly 104.16 µs."
  },
  {
    id: 3,
    question: "Under the KNX character structure, a single byte (octet) requires how many physical serial bits?",
    options: [
      "8 bits (data only)",
      "10 bits (Start + 8 data + Stop)",
      "11 bits (Start + LSB-first data + Even Parity + Stop)",
      "13 bits (Start + 8 data + Even Parity + Stop + 2 Inter-character bits)"
    ],
    correctIndex: 2,
    explanation: "Perfect! Every character transmitted on the Link/Physical Layer consists of 11 characters: 1 Start bit ('0'), 8 data bits (sent in reverse LSB-first order), 1 Even Parity checking bit, and 1 Stop bit ('1'). There are also 2 idle bit times between characters (t4 Pause), but the character itself is defined as 11 bits."
  },
  {
    id: 4,
    question: "How is the Link Layer telegram checksum (check byte) calculated at the end of a telegram?",
    options: [
      "A simple sum of all bytes modulo 256.",
      "The bitwise NOT of the bitwise XOR sum of all preceding logical bytes.",
      "The standard CRC-16 polynomial division remainder.",
      "A bitwise vertical even parity calculated exclusively across data fields."
    ],
    correctIndex: 1,
    explanation: "Exactly! The KNX TP checksum byte is calculated using a vertical odd parity method per bit column, which represents the logical operation NOT(XOR of all previous logical bytes)."
  },
  {
    id: 5,
    question: "When two KNX devices transmit simultaneously on a shared physical cable, how are collisions avoided?",
    options: [
      "A centralized master controller assigns explicit timeslices to each device.",
      "The device with the highest physical address takes precedence automatically.",
      "CSMA/CA collision avoidance where dominant logical '0' bits override passive '1' bits; the device sending '1' drops out when it hears a '0'.",
      "Bus signals are modulated on differing RF frequencies to separate transmissions."
    ],
    correctIndex: 2,
    explanation: "Excellent choice! CSMA/CA (Carrier Sense Multiple Access with Collision Avoidance) governs KNX TP1. Since a logical '0' is actively pulled low, any sender pulling '0' wins the channel over senders trying to transmit a passive '1'. If a device receives a '0' whilst transmitting '1', it drops out immediately."
  },
  {
    id: 6,
    question: "If a KNX line (x.y.0) is saturated, what is the maximum recommended number of programmable devices you can physically host on an electrical line segment?",
    options: [
      "64 devices",
      "128 devices",
      "256 devices",
      "255 devices"
    ],
    correctIndex: 2,
    explanation: "That is correct! According to modern KNX specs (e.g. ETS6 standards), a single electrical line can physically house up to 256 bus devices. Historically, lines were limited to 64, but segment couplers and advanced transceivers allow hosting up to 256."
  },
  {
    id: 7,
    question: "What is the fixed delay time (t2) defined by the KNX TP1 specifications for the pause between a telegram and its subsequent Link-Layer acknowledgement?",
    options: [
      "50 bit-periods (5.2 ms)",
      "2 bit-periods (208 µs)",
      "15 bit-periods (1.56 ms)",
      "13 bit-periods (1.35 ms)"
    ],
    correctIndex: 2,
    explanation: "Correct! The transmission break t2 is precisely 15 bit-periods (representing 1.56 ms of idle pause). This is allocated for the receiver's Link Layer to check parity and crosscheck bytes, and respond with LL_ACK, LL_NAK, or LL_BUSY."
  }
];

export const PRESET_TELEGRAMS = [
  {
    name: "Switch Light On (GroupValueWrite)",
    params: {
      repeatFlag: "1",
      targetType: "1", // Group Address
      command: APCICode.GroupValueWrite,
      source: { area: 1, line: 1, device: 10 },
      destination: { main: 1, middle: 0, sub: 1 }, // Group Address 1/0/1
      routingCounter: 6,
      priority: "11", // Low (Normal)
      dptType: "1", // 1-bit Switch value "On"
      ackType: "CC" as const,
    },
    payloadValue: "1" // On
  },
  {
    name: "Set Dimmer Level to 75% (GroupValueWrite)",
    params: {
      repeatFlag: "1",
      targetType: "1",
      command: APCICode.GroupValueWrite,
      source: { area: 1, line: 3, device: 50 },
      destination: { main: 3, middle: 2, sub: 10 }, // Group Address 3/2/10
      routingCounter: 5,
      priority: "11",
      dptType: "5", // 8-bit scale
      ackType: "CC" as const,
    },
    payloadValue: "11000000" // 192/255 = ~75%
  },
  {
    name: "Read Living Room Temp (GroupValueRead)",
    params: {
      repeatFlag: "1",
      targetType: "1",
      command: APCICode.GroupValueRead,
      source: { area: 2, line: 1, device: 15 },
      destination: { main: 4, middle: 1, sub: 2 }, // 4/1/2
      routingCounter: 6,
      priority: "11",
      dptType: "1", // 1-bit switching (ignored in read, but length is 1 byte)
      ackType: "CC" as const,
    },
    payloadValue: "0"
  },
  {
    name: "Temperature response (23.5 °C - DPT 9)",
    params: {
      repeatFlag: "1",
      targetType: "1",
      command: APCICode.GroupValueResponse,
      source: { area: 2, line: 1, device: 100 }, // Sensor
      destination: { main: 4, middle: 1, sub: 2 }, // 4/1/2
      routingCounter: 6,
      priority: "11",
      dptType: "9", // Float temperature
      ackType: "CC" as const,
    },
    payloadValue: "0001010001111011" // 23.5 encoded float
  },
  {
    name: "Security Alarm Sensor (High Priority)",
    params: {
      repeatFlag: "1",
      targetType: "1",
      command: APCICode.GroupValueWrite,
      source: { area: 1, line: 1, device: 200 },
      destination: { main: 0, middle: 5, sub: 12 }, // 0/5/12
      routingCounter: 6,
      priority: "10", // Alarm Priority
      dptType: "1",
      ackType: "CC" as const,
    },
    payloadValue: "1"
  }
];
