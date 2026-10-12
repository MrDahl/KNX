export const SYMBOL_CATEGORIES=['Sensors and controls','Actuators','HVAC','System devices','Interfaces and displays'] as const;
export type SymbolCategory=typeof SYMBOL_CATEGORIES[number];
export type CadSymbol={id:string;name:string;category:SymbolCategory;description:string;keywords:string[];svgPath?:string};
// SVGs are reviewed static files under public/symbols. No inline markup is injected.
// These generic reference entries are drawing slots, not claims about a particular product.
export const CAD_SYMBOLS:CadSymbol[]=[
 {id:'push-button',name:'Push-button sensor',category:'Sensors and controls',description:'A user-operated input device that sends configured commands, such as switching, dimming or scene selection.',keywords:['button','wall switch','taster']},
 {id:'binary-input',name:'Binary input',category:'Sensors and controls',description:'Converts a discrete input state into KNX information. The permitted input voltage or contact type depends on the device.',keywords:['contact','input','binary']},
 {id:'motion-detector',name:'Motion detector',category:'Sensors and controls',description:'Detects movement and supplies a signal for configured functions, such as lighting control.',keywords:['movement','PIR']},
 {id:'presence-detector',name:'Presence detector',category:'Sensors and controls',description:'Detects occupancy-related activity for functions such as lighting or HVAC control. Detection coverage depends on the device and installation.',keywords:['occupancy','PIR']},
 {id:'switch-actuator',name:'Switch actuator',category:'Actuators',description:'Switches electrical circuits in response to configured KNX commands. Channel count and contact ratings must be specified separately.',keywords:['relay','output','switching']},
 {id:'dimming-actuator',name:'Dimming actuator',category:'Actuators',description:'Adjusts the output to a compatible dimmable load. The load type and dimming method depend on the actuator.',keywords:['dimmer','lighting']},
 {id:'blind-actuator',name:'Blind / shutter actuator',category:'Actuators',description:'Controls a compatible motor for blinds or shutters, including movement and, where supported, slat adjustment.',keywords:['shade','shutter','jalousie']},
 {id:'room-controller',name:'Room temperature controller',category:'HVAC',description:'Compares room temperature with a setpoint and provides configured control signals for heating or cooling.',keywords:['thermostat','heating','cooling']},
 {id:'valve-actuator',name:'Valve actuator',category:'HVAC',description:'Controls compatible valve drives for heating or cooling circuits. Output type and drive compatibility depend on the device.',keywords:['heating','thermal','valve']},
 {id:'fan-coil-actuator',name:'Fan-coil actuator',category:'HVAC',description:'Controls the fan and valve functions of a compatible fan-coil unit according to its configuration.',keywords:['fan','heating','cooling']},
 {id:'bus-power-supply',name:'KNX TP power supply',category:'System devices',description:'Supplies the KNX TP bus. The bus supply requires the appropriate choke; current rating and auxiliary outputs are device-specific.',keywords:['PSU','choke','supply']},
 {id:'line-coupler',name:'Line coupler',category:'System devices',description:'Connects a KNX line to its parent line and forwards telegrams according to its configuration and filtering rules.',keywords:['topology','coupling','filter']},
 {id:'usb-interface',name:'KNX USB interface',category:'Interfaces and displays',description:'Provides a USB connection between a computer and the KNX installation, for example for commissioning and diagnostics.',keywords:['ETS','computer','USB']},
 {id:'ip-interface',name:'KNX IP interface',category:'Interfaces and displays',description:'Provides access to KNX over an IP network, typically through KNXnet/IP tunnelling. An IP interface does not necessarily provide routing.',keywords:['Ethernet','tunnel','ETS']},
 {id:'dali-gateway',name:'KNX–DALI gateway',category:'Interfaces and displays',description:'Exchanges configured control and status information between KNX and a DALI lighting system.',keywords:['lighting','DALI','gateway']},
 {id:'touch-panel',name:'Touch panel / display',category:'Interfaces and displays',description:'Provides a visual user interface for configured KNX functions, such as lighting, shading, room control and status display.',keywords:['visualisation','screen','panel']},
];
export function filterSymbols(query:string,category:string,entries:CadSymbol[]=CAD_SYMBOLS){
 const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return entries.filter(s=>(category==='all'||s.category===category)&&words.every(w=>[s.name,s.description,s.category,...s.keywords].join(' ').toLowerCase().includes(w)));
}
export const symbolAssetUrl=(path:string,base='/')=>base+path.replace(/^\//,'');
