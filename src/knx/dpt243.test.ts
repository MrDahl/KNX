import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {defaults,encodeDpt} from './dptCodec';
import {decodeDptHex,payloadHex} from './dptDecode';

test('243.600 uses KNX-confirmed time, x, y, brightness and CB order',()=>{
 const v={time:'2.5',x:'0.3127',y:'0.3290',brightness:'75',colourValid:'1',brightnessValid:'1'};
 assert.equal(payloadHex(encodeDpt('243.600',v)),'00 19 50 0D 54 39 BF 03');
 const decoded=decodeDptHex('243.600','12 34 56 78 9A BC DE 03').values;
 assert.equal(Number(decoded.time),466);
 assert.equal(Number(decoded.x),0x5678/65535);
 assert.equal(Number(decoded.y),0x9abc/65535);
 assert.equal(payloadHex(encodeDpt('243.600',decoded)),'12 34 56 78 9A BC DE 03');
 for(let flags=0;flags<4;flags++){
  const hex='00 00 FF FF 00 00 FF 0'+flags;
  const d=decodeDptHex('243.600',hex).values;
  assert.equal(d.colourValid,String(flags>>1));assert.equal(d.brightnessValid,String(flags&1));
  assert.equal(payloadHex(encodeDpt('243.600',d)),hex);
 }
 assert.equal(payloadHex(encodeDpt('243.600',{...v,time:'6553.5',x:'1',y:'1',brightness:'100'})),'FF FF FF FF FF FF FF 03');
 for(const [key,value] of [['time','6553.6'],['time','-0.1'],['x','1.01'],['y','-0.01'],['brightness','101'],['colourValid','2']])assert.throws(()=>encodeDpt('243.600',{...v,[key]:value}));
 for(const h of ['00 00 00 00 00 00 00 04','00 00 00 00 00 00 00 80','00 00','00 00 00 00 00 00 00 00 00'])assert.throws(()=>decodeDptHex('243.600',h));
 assert.equal(encodeDpt('243.600',defaults('243.600')).length,64);
});
