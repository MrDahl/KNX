import DPT_NAMES from "./knx/dptNames.json";
import { DPT_INPUTS, defaults, encodeDpt } from "./knx/dptCodec";
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

// Exact-subtype metadata and examples share the catalogue and validated codecs.
export const DPT_DEFS: DPTDefinition[] = Object.entries(DPT_INPUTS).map(([id,spec])=>({
  id, name:DPT_NAMES[id as keyof typeof DPT_NAMES], sizeBits:spec.size,
  description:spec.note??spec.name,
  exampleValues:[{value:'Default',display:spec.name,binary:encodeDpt(id,defaults(id))}]
}));

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
      hopCount: 6,
      priority: "11", // Low (Normal)
      dptType: "1.001", // 1-bit Switch value "On"
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
      hopCount: 5,
      priority: "11",
      dptType: "5.001", // 8-bit scale
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
      hopCount: 6,
      priority: "11",
      dptType: "1.001", // 1-bit switching (ignored in read, but length is 1 byte)
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
      hopCount: 6,
      priority: "11",
      dptType: "9.001", // Float temperature
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
      hopCount: 6,
      priority: "10", // Alarm Priority
      dptType: "1.001",
      ackType: "CC" as const,
    },
    payloadValue: "1"
  }
];
