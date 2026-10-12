export const SYMBOL_CATEGORIES=['Sensors and controls','Actuators','System devices','Interfaces and displays'] as const;
export type SymbolCategory=typeof SYMBOL_CATEGORIES[number];
export type CadSymbol={id:string;name:string;category:SymbolCategory;description:string;keywords:string[];svgPath?:string};
// SVGs are reviewed static files under public/symbols. No inline markup is injected.
// These generic reference entries are drawing slots, not claims about a particular product.
export const CAD_SYMBOLS:CadSymbol[]=[
 {id:'push-button',name:'Push-button sensor',category:'Sensors and controls',description:'A user-operated input device that sends configured commands, such as switching, dimming or scene selection.',svgPath:'symbols/Push_Button.svg',keywords:['button','wall switch','taster']},
 {id:'switch-actuator',name:'Switch actuator',category:'Actuators',description:'Switches electrical circuits in response to configured KNX commands. Channel count and contact ratings must be specified separately.',svgPath:'symbols/Switch_Actuator.svg',keywords:['relay','output','switching']},
 {id:'dimming-actuator',name:'Dimming actuator',category:'Actuators',description:'Adjusts the output to a compatible dimmable load. The load type and dimming method depend on the actuator.',svgPath:'symbols/Dimming_Actuator.svg',keywords:['dimmer','lighting']},
 {id:'blind-actuator',name:'Blind / shutter actuator',category:'Actuators',description:'Controls a compatible motor for blinds or shutters, including movement and, where supported, slat adjustment.',svgPath:'symbols/Blind_Actuator.svg',keywords:['shade','shutter','jalousie']},
 {id:'bus-power-supply',name:'Power supply with integrated choke',category:'System devices',description:'Supplies the KNX TP bus through an integrated choke. Select the supply rating for the connected bus load; auxiliary outputs depend on the device.',svgPath:'symbols/PSU_wChoke.svg',keywords:['PSU','choke','supply']},
 {id:'coupler-repeater',name:'Coupler / repeater',category:'System devices',description:'A generic symbol for a KNX coupler or repeater. Identify its actual role in the project legend: a line or area coupler, segment coupler and TP repeater have different forwarding behaviour and are not interchangeable.',svgPath:'symbols/Coupler.svg',keywords:['topology','coupling','filter']},
 {id:'general-gateway',name:'General gateway',category:'Interfaces and displays',description:'Exchanges configured commands and status information between KNX and another system. Label the connected system in the project legend; this symbol does not specify a protocol.',svgPath:'symbols/General_Gateway.svg',keywords:['gateway','protocol','integration']},
 {id:'touch-panel',name:'Screen / dashboard',category:'Interfaces and displays',description:'Provides a visual user interface for configured KNX functions, such as lighting, shading, room control and status display.',svgPath:'symbols/Screen_Dashboard.svg',keywords:['visualisation','screen','panel']},
];
export function filterSymbols(query:string,category:string,entries:CadSymbol[]=CAD_SYMBOLS){
 const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return entries.filter(s=>(category==='all'||s.category===category)&&words.every(w=>[s.name,s.description,s.category,...s.keywords].join(' ').toLowerCase().includes(w)));
}
export const symbolAssetUrl=(path:string,base='/')=>base+path.replace(/^\//,'');
