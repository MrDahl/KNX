export interface KNXAddressIndividual {
  area: number;     // 0 - 15
  line: number;     // 0 - 15
  device: number;   // 0 - 255
}

export interface KNXAddressGroup {
  main: number;     // 0 - 31
  middle: number;   // 0 - 7
  sub: number;      // 0 - 255
}

export enum APCICode {
  GroupValueRead = "0000",
  GroupValueResponse = "0001",
  GroupValueWrite = "0010",
  PhysAddrWrite = "0011",
  PhysAddrRead = "0100",
  PhysAddrResponse = "0101",
  AdcRead = "0110",
  AdcResponse = "0111",
  MemoryRead = "1000",
  MemoryResponse = "1001",
  MemoryWrite = "1010",
  UserMessage = "1011",
  DeviceDescriptorRead = "1100",
  DeviceDescriptorResponse = "1101",
  Restart = "1110",
  Escape = "1111",
}

export interface APCIDefinition {
  code: APCICode;
  name: string;
  description: string;
  isManagement: boolean;
}

export interface DPTDefinition {
  id: string;
  name: string;
  sizeBits: number;
  description: string;
  exampleValues: { value: string; display: string; binary: string }[];
}

export interface TelegramParams {
  repeatFlag: "0" | "1"; // "1" = original (not repeated), "0" = repeated
  targetType: "0" | "1"; // "1" = group/multicast, "0" = individual/unicast
  command: APCICode;
  source: KNXAddressIndividual;
  destination: KNXAddressGroup | KNXAddressIndividual;
  routingCounter: number; // 0 - 7 (Hop Count, default 6)
  priority: "00" | "10" | "01" | "11"; // System, Alarm, High, Low
  dptType: string;
  ackType: "CC" | "0C" | "C0"; // CC = LL_ACK, 0C = LL_NAK, C0 = LL_BUSY
}

export interface TelegramByte {
  index: number;
  name: string;
  logicalBinary: string;
  hex: string;
  physicalBits: {
    start: string;     // always '0' (1 bit)
    dataReversed: string; // 8 bits (LSB-first)
    parity: string;    // 1 bit
    stop: string;      // always '1' (1 bit)
  };
  details: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
