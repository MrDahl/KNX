import {RouteNode} from './teachingModels';

/** Diagram addresses are examples, not required segment boundaries. */
export const hopCountDevices: RouteNode[] = [
  {id:'1.0.0',address:'1.0.0',label:'Area coupler',type:'backbone_coupler'},
  {id:'1.1.0',address:'1.1.0',label:'Line coupler',type:'line_coupler'},
  {id:'1.1.1',address:'1.1.1',label:'Bus device',type:'static_device'},
  {id:'1.1.67',address:'1.1.67',label:'Line repeater',type:'repeater'},
  {id:'1.1.102',address:'1.1.102',label:'Bus device',type:'static_device'},
  {id:'1.1.144',address:'1.1.144',label:'Line repeater',type:'repeater'},
  {id:'1.1.180',address:'1.1.180',label:'Bus device',type:'static_device'},
  {id:'1.1.204',address:'1.1.204',label:'Line repeater',type:'repeater'},
  {id:'source',address:'1.1.252',label:'Source · segment 4',type:'device'},
  {id:'15.0.0',address:'15.0.0',label:'Area coupler',type:'backbone_coupler'},
  {id:'15.1.0',address:'15.1.0',label:'Line coupler',type:'line_coupler'},
  {id:'15.1.5',address:'15.1.5',label:'Bus device',type:'static_device'},
  {id:'15.1.60',address:'15.1.60',label:'Line repeater',type:'repeater'},
  {id:'15.1.86',address:'15.1.86',label:'Bus device',type:'static_device'},
  {id:'15.1.98',address:'15.1.98',label:'Line repeater',type:'repeater'},
  {id:'15.1.99',address:'15.1.99',label:'Bus device',type:'static_device'},
  {id:'15.1.201',address:'15.1.201',label:'Line repeater',type:'repeater'},
  {id:'destination',address:'15.1.255',label:'Receiver · segment 4',type:'device'},
];
export function routingExample(mode: 'series' | 'parallel'): RouteNode[] {
  const ids=['source','1.1.204',...(mode==='series'?['1.1.144','1.1.67']:[]),'1.1.0','1.0.0','15.0.0','15.1.0',...(mode==='series'?['15.1.60','15.1.98']:[]),'15.1.201','destination'];
  return ids.map(id=>hopCountDevices.find(n=>n.id===id)!);
}
