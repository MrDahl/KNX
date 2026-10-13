export const SYMBOL_CATEGORIES=['Sensors and controls','Actuators','System devices','Interfaces and displays'] as const;
export type SymbolCategory=typeof SYMBOL_CATEGORIES[number];
export type CadSymbol={id:string;name:string;category:SymbolCategory;description:string;keywords:string[];svgPath?:string};
// SVGs are reviewed static files under public/symbols. No inline markup is injected.
// Original symbols supplied by Marc Sonne Dahl; artwork is preserved byte-for-byte.
export const CAD_SYMBOLS:CadSymbol[]=[
  {
    "id": "bus-power-supply",
    "name": "Power supply with integrated choke",
    "category": "System devices",
    "description": "Supplies the KNX TP bus with DC power through an integrated choke. The choke allows communication signals to remain on the bus. Choose the supply rating to suit the connected devices and segment design.",
    "keywords": [
      "PSU",
      "power",
      "supply"
    ],
    "svgPath": "symbols/bus-power-supply.svg"
  },
  {
    "id": "dimming-actuator",
    "name": "Dimming actuator",
    "category": "Actuators",
    "description": "Controls the brightness of compatible lighting in response to KNX commands. The supported load type, dimming method and number of channels depend on the actuator.",
    "keywords": [
      "dimmer",
      "lighting",
      "brightness"
    ],
    "svgPath": "symbols/dimming-actuator.svg"
  },
  {
    "id": "blind-actuator",
    "name": "Blind / shutter actuator",
    "category": "Actuators",
    "description": "Controls up/down movement of compatible blind or shutter motors. Depending on the device and configuration, it can also control position and slat angle.",
    "keywords": [
      "shade",
      "motor",
      "up",
      "down"
    ],
    "svgPath": "symbols/blind-actuator.svg"
  },
  {
    "id": "push-button",
    "name": "Push button",
    "category": "Sensors and controls",
    "description": "A manual input device that sends configured KNX commands when operated, for example switching, dimming, blind movement or scene recall. Its function is assigned during configuration.",
    "keywords": [
      "button",
      "wall switch"
    ],
    "svgPath": "symbols/push-button.svg"
  },
  {
    "id": "coupler-repeater",
    "name": "Line coupler / area coupler / line repeater",
    "category": "System devices",
    "description": "A shared drawing symbol for three distinct roles. A line coupler connects a line to its main line; an area coupler connects a main line to the backbone. A TP line repeater extends a line across segments. State the actual role in the project legend: coupling and repeating follow different forwarding rules.",
    "keywords": [
      "topology",
      "coupling",
      "filter",
      "repeater"
    ],
    "svgPath": "symbols/coupler-repeater.svg"
  },
  {
    "id": "usb-interface",
    "name": "USB interface",
    "category": "Interfaces and displays",
    "description": "Connects a computer to the KNX bus via USB, for example for commissioning and diagnostics with ETS. It provides access to the bus; it does not replace a bus power supply.",
    "keywords": [
      "ETS",
      "computer",
      "programming"
    ],
    "svgPath": "symbols/usb-interface.svg"
  },
  {
    "id": "ip-router-interface",
    "name": "IP router / IP interface",
    "category": "Interfaces and displays",
    "description": "Provides access to KNX over an IP network. An IP interface typically provides KNXnet/IP tunnelling for a client such as ETS. An IP router also supports KNXnet/IP routing between KNX lines over IP. Identify the actual device role in the project legend.",
    "keywords": [
      "Ethernet",
      "tunnel",
      "routing",
      "ETS"
    ],
    "svgPath": "symbols/ip-router-interface.svg"
  },
  {
    "id": "logic-controller",
    "name": "Logic controller",
    "category": "System devices",
    "description": "Processes KNX values using configured logic, conditions, timers or calculations, then sends resulting commands or values. Available functions depend on the controller and its application.",
    "keywords": [
      "automation",
      "AND",
      "OR",
      "timer"
    ],
    "svgPath": "symbols/logic-controller.svg"
  },
  {
    "id": "generic-gateway",
    "name": "Generic gateway",
    "category": "Interfaces and displays",
    "description": "Exchanges configured commands and status information between KNX and another system. Identify the other system and the supported functions in the project legend and device documentation.",
    "keywords": [
      "protocol",
      "integration",
      "DALI"
    ],
    "svgPath": "symbols/generic-gateway.svg"
  },
  {
    "id": "screen-dashboard",
    "name": "Touch screen / information screen / dashboard",
    "category": "Interfaces and displays",
    "description": "Displays KNX values and status information. An interactive screen can also send commands for functions such as lighting, shading or room control; an information-only display may provide no controls.",
    "keywords": [
      "visualisation",
      "panel",
      "touch"
    ],
    "svgPath": "symbols/screen-dashboard.svg"
  },
  {
    "id": "infrared-sensor",
    "name": "Infrared sensor",
    "category": "Sensors and controls",
    "description": "Detects infrared changes for functions such as motion or presence detection and sends the configured KNX information. Coverage, sensitivity and occupancy-related functions depend on the sensor and its installation.",
    "keywords": [
      "PIR",
      "motion",
      "presence",
      "occupancy"
    ],
    "svgPath": "symbols/infrared-sensor.svg"
  },
  {
    "id": "switch-actuator",
    "name": "Switch actuator",
    "category": "Actuators",
    "description": "Switches connected electrical loads on or off in response to KNX commands. The number of channels, contact ratings and supported load types depend on the actuator.",
    "keywords": [
      "relay",
      "output",
      "on",
      "off"
    ],
    "svgPath": "symbols/switch-actuator.svg"
  },
  {
    "id": "generic-sensor",
    "name": "Generic sensor",
    "category": "Sensors and controls",
    "description": "Measures or detects a physical condition and makes the value or state available to KNX, for example temperature, brightness or a contact state. Specify the measured quantity in the project legend.",
    "keywords": [
      "measurement",
      "temperature",
      "brightness",
      "input"
    ],
    "svgPath": "symbols/generic-sensor.svg"
  }
];
export function filterSymbols(query:string,category:string,entries:CadSymbol[]=CAD_SYMBOLS){
 const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return entries.filter(s=>(category==='all'||s.category===category)&&words.every(w=>[s.name,s.description,s.category,...s.keywords].join(' ').toLowerCase().includes(w)));
}
export const symbolAssetUrl=(path:string,base='/')=>base+path.replace(/^\//,'');
