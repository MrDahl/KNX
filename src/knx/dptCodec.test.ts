import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { DPT_INPUTS, defaults, encodeDpt, decodeFloat } from './dptCodec';
const hex=(id:string,fields:Record<string,string>)=>encodeDpt(id,{...defaults(id),...fields}).match(/.{1,8}/g)!.map(b=>parseInt(b,2).toString(16).padStart(2,'0')).join(' ').toUpperCase();
test('Every supported subtype has a valid typed default with correct width',()=>{
 for(const [id,spec] of Object.entries(DPT_INPUTS))assert.equal(encodeDpt(id,defaults(id)).length,spec.size,id);
});
test('Known temperature, scaling, signed and float32 vectors',()=>{
 assert.equal(hex('9.001',{value:'23.5'}),'0C 97');
 assert.equal(hex('9.001',{value:'-30'}),'8A 24');
 assert.equal(hex('5.001',{value:'75'}),'BF');
 assert.equal(hex('6.001',{value:'-128'}),'80');
 assert.equal(hex('13.001',{value:'-2147483648'}),'80 00 00 00');
 assert.equal(hex('12.001',{value:'4294967295'}),'FF FF FF FF');
 assert.equal(hex('14.000',{value:'1'}),'3F 80 00 00');
 assert.equal(decodeFloat(encodeDpt('9.001',{value:'23.5'})),23.5);
});
test('Scene offset, learn flag, date century and time reserved bits',()=>{
 assert.equal(hex('17.001',{scene:'64'}),'3F');
 assert.equal(hex('18.001',{scene:'64',action:'1'}),'BF');
 assert.equal(hex('10.001',{day:'7',time:'23:59:59'}),'F7 3B 3B');
 assert.equal(hex('11.001',{date:'1999-12-31'}),'1F 0C 63');
 assert.equal(hex('11.001',{date:'2000-01-01'}),'01 01 00');
 assert.equal(hex('19.001',{date:'2026-01-01',time:'12:00:00'}),'7E 01 01 8C 00 00 20 00');
});
test('Reject malformed, out-of-range and reserved semantic inputs',()=>{
 for(const [id,value] of [['5.001','101'],['9.001','-274'],['9.007','-1'],['20.102','5'],['7.001','1.5'],['12.001','4294967296'],['14.000','Infinity']])assert.throws(()=>encodeDpt(id,{...defaults(id),value}));
 for(const date of ['2025-02-29','2089-02-30','2090-01-01','1989-12-31'])assert.throws(()=>encodeDpt('11.001',{date}));
 assert.equal(hex('11.001',{date:'2024-02-29'}),'1D 02 18');
 assert.throws(()=>encodeDpt('10.001',{day:'1',time:'24:01:00'}));
 assert.throws(()=>encodeDpt('16.000',{text:'æ'}));
 assert.throws(()=>encodeDpt('16.000',{text:'123456789012345'}));
 assert.throws(()=>encodeDpt('17.001',{scene:'65'}));
 assert.throws(()=>encodeDpt('221.001',{hex:'123'}));
});
test('Text padding, serial and RGB ordering',()=>{
 assert.equal(hex('16.000',{text:'KNX'}),'4B 4E 58 00 00 00 00 00 00 00 00 00 00 00');
 assert.equal(hex('232.600',{colour:'#ff0080'}),'FF 00 80');
 assert.equal(hex('221.001',{hex:'000112345678'}),'00 01 12 34 56 78');
});
