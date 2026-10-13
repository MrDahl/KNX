import React from 'react';
import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {HopCountTopology} from './HopCountTopology';
import {hopCountDevices,routingExample} from '../knx/routingExample';
import {traceRoute} from '../knx/teachingModels';
const render=(mode:'parallel'|'series',step:number,filter='')=>{
 const nodes=routingExample(mode),trace=traceRoute(nodes,6,filter);
 return renderToStaticMarkup(<HopCountTopology nodes={nodes} trace={trace} step={step} mode={mode}/>);
};
test('diagram contains distinct addresses and all example devices in both arrangements',()=>{
 assert.equal(new Set(hopCountDevices.map(n=>n.address)).size,18);
 for(const mode of ['series','parallel'] as const){
  const svg=render(mode,-1);
  assert.equal((svg.match(/data-device-address=/g)||[]).length,18);
  for(const node of routingExample(mode))assert.ok(hopCountDevices.includes(node));
  assert.doesNotMatch(svg,/HC = 6/);
 }
});
test('parallel diagram reaches the receiver at HC 0 without marking other branches rejected',()=>{
 const svg=render('parallel',7);
 assert.match(svg,/data-route-to="destination" data-route-state="reached"/);
 assert.match(svg,/HC = 0/);
 assert.doesNotMatch(svg,/data-route-state="not-reached"/);
});
test('series and filter rejection show incoming leg as reached, only downstream legs as unreached',()=>{
 const series=render('series',7);
 assert.match(series,/data-route-to="15.1.0" data-route-state="reached"/);
 assert.match(series,/data-route-to="15.1.60" data-route-state="not-reached"/);
 assert.match(series,/Red dotted path: not reached/);
 const filtered=render('parallel',2,'1.1.0');
 assert.match(filtered,/data-route-to="1.1.0" data-route-state="reached"/);
 assert.match(filtered,/data-route-to="1.0.0" data-route-state="not-reached"/);
 assert.doesNotMatch(render('parallel',1,'1.1.0'),/data-route-state="not-reached"/);
});
