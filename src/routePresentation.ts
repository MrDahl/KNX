import {msg} from './i18n';
import type {RouteNode,traceRoute} from './knx/teachingModels';
export function routeReason(event:ReturnType<typeof traceRoute>[number],node:RouteNode,index:number):string {
 if(index===0)return msg('route.source',{hc:event.after});
 if(node.type==='device'||node.type==='static_device')return msg('route.receiver',{hc:event.after});
 if(event.before===0)return msg('route.zero');
 if(event.blocked)return msg('route.filter');
 return msg(node.type==='repeater'?'route.repeater':'route.forward',{before:event.before,after:event.after});
}
