import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {defaults,encodeDpt} from './dptCodec';
import {decodeDptHex,payloadHex} from './dptDecode';
import {dptInterpretation} from './dptInterpretation';
test('8.010 reserves the nominal upper endpoint as invalid data',()=>{
 assert.equal(payloadHex(encodeDpt('8.010',{value:'327.66'})),'7F FE');
 assert.equal(decodeDptHex('8.010','7F FE').values.value,'327.66');
 assert.throws(()=>encodeDpt('8.010',{value:'327.67'}));
 assert.throws(()=>decodeDptHex('8.010','7F FF'));
});
test('DALI duration interpretations are conditional and never modify KNX bytes',()=>{
 for(const raw of ['0','90','255']){
  const values={...defaults('248.600'),durationRaw:raw};
  const hex=payloadHex(encodeDpt('248.600',values));
  assert.equal(decodeDptHex('248.600',hex).values.durationRaw,raw);
  assert.match(dptInterpretation('248.600',values)!,/KNX-level scaling unconfirmed/);
 }
 assert.match(dptInterpretation('248.600',{durationRaw:'90'})!,/180 min/);
 assert.match(dptInterpretation('248.600',{durationRaw:'255'})!,/510 min or longer/);
 assert.equal(dptInterpretation('248.600',{durationRaw:'256'}),null);
 assert.equal(dptInterpretation('247.600',{durationRaw:'90'}),null);
});
