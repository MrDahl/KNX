import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {DPT_INPUTS,defaults,encodeDpt} from './dptCodec';
import {decodeDptHex,payloadHex} from './dptDecode';
const hex=(id:string,v:Record<string,string>)=>payloadHex(encodeDpt(id,{...defaults(id),...v}));
test('status polarity, sparse mode values and general-status reserved bits',()=>{
 assert.equal(hex('6.020',{a:'1',mode:'4'}),'84');assert.equal(DPT_INPUTS['6.020'].fields[0].options![0],'Set');
 for(const n of [0,3,5,6,7])assert.throws(()=>decodeDptHex('6.020',n.toString(16).padStart(2,'0')));
 assert.equal(decodeDptHex('21.001','10').values.unack,'1');assert.throws(()=>decodeDptHex('21.001','20'));
 assert.equal(decodeDptHex('22.101','01 00').values.b8,'1');assert.throws(()=>decodeDptHex('22.101','80 00'));
 assert.equal(decodeDptHex('22.100','00 80').values.b7,'1');assert.throws(()=>decodeDptHex('22.100','01 00'));
});
test('system enumerations, mandatory RF bit and nibble ranges',()=>{
 for(const id of ['20.1001','20.1002','20.1004','21.1000','25.1000'])assert.equal(DPT_INPUTS[id].telegramAllowed,false);
 assert.equal(decodeDptHex('20.1001','07').values.value,'7');assert.throws(()=>decodeDptHex('20.1001','00'));
 assert.equal(decodeDptHex('20.1004','05').values.value,'5');assert.throws(()=>decodeDptHex('20.1004','03'));
 assert.equal(hex('21.1000',{slave:'1'}),'05');assert.throws(()=>decodeDptHex('21.1000','00'));assert.throws(()=>decodeDptHex('21.1000','09'));
 assert.deepEqual(decodeDptHex('25.1000','23').values,{busy:'2',nak:'3'});assert.throws(()=>decodeDptHex('25.1000','40'));
 for(const [id,n] of [['21.1010',8],['22.1010',16],['30.1010',24]] as const){const v=decodeDptHex(id,'80'+'00'.repeat(n/8-1)).values;assert.equal(v['channel'+n],'1');assert.equal(v.channel1,'0');}
});
test('combined output status separates validity and state masks',()=>{
 const v=decodeDptHex('27.001','80 01 00 01').values;assert.equal(v.valid16,'1');assert.equal(v.valid1,'1');assert.equal(v.state1,'1');assert.equal(v.state16,'0');assert.equal(v.valid2,'0');
});
test('colour transition and relative controls retain component order and validity masks',()=>{
 assert.equal(hex('249.600',{time:'2.5',temperature:'3000',brightness:'100',timeValid:'1',temperatureValid:'1',brightnessValid:'1'}),'00 19 0B B8 FF 07');
 assert.equal(hex('250.600',{direction0:'1',step0:'3',step1:'2',valid0:'1'}),'0B 02 02');
 assert.equal(hex('252.600',{direction0:'1',step0:'1',step3:'7',valid0:'1',valid3:'1'}),'09 00 00 07 09');
 assert.equal(hex('253.600',{step0:'1',step1:'2',step2:'3',valid0:'1',valid2:'1'}),'01 02 03 05');
 assert.equal(hex('254.600',{step0:'1',step1:'2',step2:'3'}),'01 02 03');
 assert.equal(hex('251.600',{red:'100',green:'0',blue:'100',white:'0',redValid:'1',whiteValid:'1'}),'FF 00 FF 00 00 09');
 for(const [id,h] of [['249.600','00 19 0B B8 FF 08'],['250.600','10 00 00'],['252.600','00 00 00 00 10'],['253.600','00 00 00 08'],['254.600','00 10 00'],['251.600','00 00 00 00 01 00']])assert.throws(()=>decodeDptHex(id,h));
});
test('three-phase floats are big-endian and reject special IEEE encodings',()=>{
 for(const id of ['257.1200','257.1201','257.1202']){
  assert.deepEqual(decodeDptHex(id,'3F 80 00 00 C0 00 00 00 40 60 00 00').values,{phase1:'1',phase2:'-2',phase3:'3.5'});
  assert.throws(()=>decodeDptHex(id,'7F 80 00 00 00 00 00 00 00 00 00 00'));
 }
});
test('converter information and ERL duty-cycle status respect units and ranges',()=>{
 assert.deepEqual(decodeDptHex('272.600','01 00 A8 2A 30 FF 3F').values,{valid:'1',emergency:'168',total:'10800',level:'255',address:'63'});
 for(const h of ['03 00 00 00 00 00 00','01 00 00 00 00 00 40'])assert.throws(()=>decodeDptHex('272.600',h));
 const v=decodeDptHex('276.1200','FF 00 FF 15').values;assert.equal(v.f1,'100');assert.equal(v.f2,'0');assert.equal(v.f3alarm,'1');assert.equal(v.f1alarm,'1');assert.equal(v.tic,'1');assert.equal(v.update,'0');
 assert.throws(()=>decodeDptHex('276.1200','00 00 00 20'));
});
test('ISO 8859-1 fixed text preserves characters and validates padding',()=>{
 const h='C6 D8 C5 E6 F8 E5 00 00 00 00 00 00 00 00';assert.equal(hex('16.001',{text:'ÆØÅæøå'}),h);assert.equal(decodeDptHex('16.001',h).values.text,'ÆØÅæøå');
 assert.throws(()=>hex('16.001',{text:'€'}));assert.throws(()=>hex('16.001',{text:'abcdefghijklmno'}));assert.throws(()=>decodeDptHex('16.001','41 00 42 00 00 00 00 00 00 00 00 00 00 00'));
});
