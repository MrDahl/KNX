import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {DPT_INPUTS,defaults,encodeDpt} from './dptCodec';
import {decodeDptHex,payloadHex} from './dptDecode';
import {DPT_BY_ID} from '../components/dptDatabase';
const roundTrip=(id:string,hex:string)=>{const d=decodeDptHex(id,hex);assert.equal(payloadHex(encodeDpt(id,d.values)),hex);return d.values;};
test('245.600 converter test result: valid vectors decode to the specified fields and round-trip',()=>{
 assert.deepEqual(roundTrip('245.600','11 00 60 00 B4 FE'),{ltrf:'1',ltrd:'1',ltrp:'0',sf:'1',sd:'2',sp:'0',ldtr:'180',lpdtr:'254'});
 assert.equal(roundTrip('245.600','11 00 60 01 FE FE').ldtr,'510');
 assert.deepEqual(roundTrip('245.600','53 40 94 00 00 FF'),{ltrf:'5',ltrd:'3',ltrp:'4',sf:'2',sd:'1',sp:'1',ldtr:'0',lpdtr:'255'});
 assert.deepEqual(roundTrip('245.600','00 00 00 00 00 FF'),{ltrf:'0',ltrd:'0',ltrp:'0',sf:'0',sd:'0',sp:'0',ldtr:'0',lpdtr:'255'});
 assert.equal(payloadHex(encodeDpt('245.600',{...defaults('245.600'),ltrf:'1',ltrd:'1',sf:'1',sd:'2',ldtr:'180',lpdtr:'254'})),'11 00 60 00 B4 FE');
 assert.equal(encodeDpt('245.600',defaults('245.600')).length,48);
});
test('245.600 rejects reserved bits, reserved codes, out-of-range minutes and wrong lengths',()=>{
 for(const h of ['11 01 60 00 B4 FE','11 00 61 00 B4 FE','11 00 E0 00 B4 FE','61 00 60 00 B4 FE','06 00 00 00 00 FF','11 00 60 01 FF FE','11 00 60 00 B4','11 00 60 00 B4 FE 00'])assert.throws(()=>decodeDptHex('245.600',h),h);
 for(const v of [{ldtr:'511'},{ldtr:'-1'},{ldtr:'1.5'},{lpdtr:'256'},{lpdtr:'-1'},{ltrf:'6'},{ltrd:'15'},{ltrp:'7'},{sf:'3'},{sd:'3'},{sp:'3'}])assert.throws(()=>encodeDpt('245.600',{...defaults('245.600'),...v}),JSON.stringify(v));
});
test('246.600 battery info: valid vectors decode to the specified fields and round-trip',()=>{
 assert.deepEqual(roundTrip('246.600','01 FE'),{fullyCharged:'0',durationFailure:'0',failure:'1',charge:'254'});
 assert.deepEqual(roundTrip('246.600','04 FE'),{fullyCharged:'1',durationFailure:'0',failure:'0',charge:'254'});
 assert.deepEqual(roundTrip('246.600','03 00'),{fullyCharged:'0',durationFailure:'1',failure:'1',charge:'0'});
 assert.deepEqual(roundTrip('246.600','00 FF'),{fullyCharged:'0',durationFailure:'0',failure:'0',charge:'255'});
 assert.equal(encodeDpt('246.600',defaults('246.600')).length,16);
});
test('246.600 rejects reserved bits, out-of-range charge level and wrong lengths',()=>{
 for(const h of ['08 00','80 00','F8 FF','01','01 02 03'])assert.throws(()=>decodeDptHex('246.600',h),h);
 for(const v of [{charge:'256'},{charge:'-1'},{charge:'1.5'},{failure:'2'},{durationFailure:'2'},{fullyCharged:'2'}])assert.throws(()=>encodeDpt('246.600',{...defaults('246.600'),...v}),JSON.stringify(v));
});
test('245.600 and 246.600 are interactive in the catalogue',()=>{
 for(const id of ['245.600','246.600']){assert.ok(DPT_INPUTS[id],id);assert.equal(DPT_BY_ID[id].supported,true,id);assert.equal(DPT_BY_ID[id].layoutPending,false,id);}
});
