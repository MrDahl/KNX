import { DPT_1bit, DPT_2bit, DPT_4bit, DPT_1byte, DPT_2byte } from "./dpt1to8";
import { DPT_9_float, DPT_3to4bytes, DPT14_additions_raw, DPT_strs_scenes } from "./dpt9to19";
import { DPT_N8_enums, DPT_bitfields_and_actions, DPT_strings_and_other } from "./dpt20to30";
import { DPT_validity_and_extended } from "./dptExtended";

export interface DptItem {
  id: string;
  name: string;
  size: string;
  dataType: string;
  range: string;
  category: "1-bit" | "2-bit" | "8-bit" | "composite";
  detailedDesc: string;
}

const buildFullDatabase = (): [string, string, string, string, string][] => {
  const result: [string, string, string, string, string][] = [
    ...DPT_1bit,
    ...DPT_2bit,
    ...DPT_4bit,
    ...DPT_1byte,
    ...DPT_2byte,
    ...DPT_9_float,
    ...DPT_3to4bytes
  ];

  // Programmatically generate DPT 14.xxx [14.011 ... 14.080]
  DPT14_additions_raw.forEach(([suffix, name, unit]) => {
    const padded = suffix.padStart(3, '0');
    result.push([
      `14.${padded}`,
      "4 bytes",
      `DPT_Value_${name}`,
      "Float",
      `[-3.4e38 … 3.4e38] ${unit}`.trim()
    ]);
  });

  // Volume flux DPTs (14.1200 and 14.1201)
  result.push(
    ["14.1200", "4 bytes", "DPT_Volume_Flux_Meter", "Float", "[-3.4e38 … 3.4e38] m³/h"],
    ["14.1201", "4 bytes", "DPT_Volume_Flux_ls", "Float", "[-3.4e38 … 3.4e38] l/s"]
  );

  result.push(...DPT_strs_scenes);
  result.push(...DPT_N8_enums);
  result.push(...DPT_bitfields_and_actions);
  result.push(...DPT_strings_and_other);
  result.push(...DPT_validity_and_extended);

  return result;
};

const rawDatabase = buildFullDatabase();

export const DPT_DATABASE: DptItem[] = rawDatabase.map(([id, size, name, dataType, range]) => {
  let category: "1-bit" | "2-bit" | "8-bit" | "composite" = "composite";

  if (size === "1 bit") {
    category = "1-bit";
  } else if (size === "2 bits") {
    category = "2-bit";
  } else if (
    size === "4 bits" ||
    size === "3 bits" ||
    size === "1 byte" ||
    size === "1 bytes"
  ) {
    category = "8-bit";
  } else {
    category = "composite";
  }

  const detailedDesc = `KNX Datapoint Type ${id}, named ${name} with a footprint size of ${size}. Represents data values formatted as ${dataType} with standard range constraints: ${range}.`;

  return {
    id,
    name,
    size,
    dataType,
    range,
    category,
    detailedDesc
  };
});
