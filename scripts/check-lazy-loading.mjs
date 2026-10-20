import {build} from 'vite';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
// Inspect the production module graph, not chunk names or source-code patterns.
const result=await build({logLevel:'error',build:{write:false}});
const chunks=result.output.filter(x=>x.type==='chunk');
const byFile=new Map(chunks.map(c=>[c.fileName,c]));
const initial=new Set();
function visit(file){if(initial.has(file))return;initial.add(file);for(const dependency of byFile.get(file)?.imports??[])visit(dependency);}
for(const chunk of chunks.filter(c=>c.isEntry))visit(chunk.fileName);
const deferred=['/src/knx/dptCatalogue.json','/src/locales/da.json','/src/locales/lookup.json','/src/locales/templates.json','/src/components/CaptureAnalyser.tsx','/src/components/DatapointTypesList.tsx','/src/components/CadSymbols.tsx'];
for(const suffix of deferred){
 const owner=chunks.find(c=>Object.keys(c.modules).some(id=>id.endsWith(suffix)));
 assert.ok(owner,`${suffix} must remain available in the build`);
 assert.ok(!initial.has(owner.fileName),`${suffix} must not load with the initial telegram page`);
}
const eager=chunks.filter(c=>initial.has(c.fileName));
console.log(`Verified ${deferred.length} lazy boundaries. Initial JavaScript: ${eager.reduce((n,c)=>n+Buffer.byteLength(c.code),0)} bytes; gzip: ${eager.reduce((n,c)=>n+gzipSync(c.code).length,0)} bytes.`);
