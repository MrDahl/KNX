import {RouteNode} from './teachingModels';
export function routingExample(mode: 'series' | 'parallel'): RouteNode[] {
  const repeater = (address: string): RouteNode => ({id:address, address, label:'Line repeater', type:'repeater'});
  return [
    {id:'source', address:'1.1.255', label:'Source · segment 4', type:'device'},
    ... (mode === 'series' ? ['1.1.192','1.1.128','1.1.64'] : ['1.1.192']).map(repeater),
    {id:'1.1.0', address:'1.1.0', label:'Line coupler', type:'line_coupler'},
    {id:'1.0.0', address:'1.0.0', label:'Backbone coupler', type:'backbone_coupler'},
    {id:'15.0.0', address:'15.0.0', label:'Backbone coupler', type:'backbone_coupler'},
    {id:'15.15.0', address:'15.15.0', label:'Line coupler', type:'line_coupler'},
    ... (mode === 'series' ? ['15.15.64','15.15.128','15.15.192'] : ['15.15.192']).map(repeater),
    {id:'destination', address:'15.15.255', label:'Receiver · segment 4', type:'device'},
  ];
}
