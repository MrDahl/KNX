import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {DPT_INPUTS,defaults,encodeDpt} from './dptCodec';
import {decodeDptHex,payloadHex} from './dptDecode';
import {EXPANDED_DPTS} from './dptExpandedCodec';
const hex=(id:string,v:Record<string,string>)=>payloadHex(encodeDpt(id,{...defaults(id),...v}));
test('Boolean polarity, controlled value and blinds direction have distinct meanings',()=>{
 assert.equal(hex('1.009',{value:'0'}),'00');assert.equal(DPT_INPUTS['1.009'].fields[0].options![0],'Open');
 assert.equal(DPT_INPUTS['1.019'].fields[0].options![0],'Closed');
 assert.equal(hex('2.008',{control:'1',value:'1'}),'03');assert.equal(hex('3.008',{direction:'1',step:'7'}),'0F');
 assert.throws(()=>decodeDptHex('2.008','04'));assert.throws(()=>encodeDpt('1.1200',{value:'-1'}));
});
test('Explicit sparse enums accept standard codes and reject holes across every octet',()=>{
 const codes:Record<string,number[]>={
  '20.006':[0,1,10,11,12,13,14,20,30,40,50],'20.007':[1,2,3],'20.020':[1,2],
  '20.105':[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,20],
  '20.114':[0,1,2,3,4,5,6,7,8,10,11,12,13,32,33,40,41,255],
  '20.611':[1,2,3,4,5,6],'20.1200':[0,1,2,255]
 };
 for(const [id,valid] of Object.entries(codes))for(let n=0;n<256;n++){
  const h=n.toString(16).padStart(2,'0');
  if(valid.includes(n)){assert.equal(decodeDptHex(id,h).values.value,String(n));assert.equal(hex(id,{value:String(n)}),h.toUpperCase());}
  else{assert.throws(()=>decodeDptHex(id,h),`${id}: ${n}`);assert.throws(()=>encodeDpt(id,{value:String(n)}));}
 }
 assert.equal(DPT_INPUTS['20.001'].fields[0].options![1],'Slave');
 assert.equal(DPT_INPUTS['20.112'].fields[0].options![1],'Master');
});
test('Scaled integer units, invalid markers and unsigned interoperability constraints',()=>{
 for(const [id,value,expected] of [['5.004','100','64'],['7.003','1000','00 64'],['8.004','-100','FF FF'],['8.010','12.34','04 D2'],['13.002','-0.0001','FF FF FF FF'],['12.1200','2147483647','7F FF FF FF']]){
  assert.equal(hex(id,{value}),expected);assert.equal(decodeDptHex(id,expected).values.value,value);
 }
 for(const [id,value] of [['7.003','11'],['8.010','1.001'],['13.002','0.00001'],['12.1200','2147483648'],['5.006','255']])assert.throws(()=>hex(id,{value}));
 assert.throws(()=>decodeDptHex('8.010','7F FF'));assert.throws(()=>decodeDptHex('12.1201','80 00 00 00'));
});
test('F16 known vectors and subtype boundaries never emit the invalid-data marker',()=>{
 assert.equal(hex('9.002',{value:'-30'}),'8A 24');assert.equal(hex('9.004',{value:'1000'}),'36 1B');
 assert.equal(hex('9.002',{value:'670433.28'}),'7F FE');assert.equal(hex('9.002',{value:'-671088.64'}),'F8 00');
 for(const id of Object.keys(DPT_INPUTS).filter(id=>id.startsWith('9.'))){
  const f=DPT_INPUTS[id].fields[0];
  for(const value of [f.min!,f.max!,0,1,2048]){
   const h=hex(id,{value:String(value)});assert.notEqual(h,'7F FF');const decoded=Number(decodeDptHex(id,h).values.value);assert.ok(decoded>=f.min!&&decoded<=f.max!,`${id}: ${decoded}`);
  }
  assert.throws(()=>decodeDptHex(id,'7FFF'));assert.throws(()=>hex(id,{value:'670760.96'}));
 }
 assert.throws(()=>hex('9.004',{value:'-1'}));assert.throws(()=>decodeDptHex('9.001','AB55')); // Below the temperature minimum.
});
test('F32 finite values, negative zero and smallest subnormal preserve wire bytes',()=>{
 for(const id of ['14.052','14.1200','14.1201']){
  assert.equal(hex(id,{value:'1'}),'3F 80 00 00');
  for(const h of ['80 00 00 00','00 00 00 01','7F 7F FF FF','FF 7F FF FF'])assert.equal(hex(id,decodeDptHex(id,h).values),h);
  for(const h of ['7F 80 00 00','FF 80 00 00','7F C0 00 00'])assert.throws(()=>decodeDptHex(id,h));
 }
});
test('64-bit energy counters remain exact beyond JavaScript safe integer range',()=>{
 for(const id of ['29.010','29.011','29.012']){
  for(const [value,h] of [['9007199254740993','00 20 00 00 00 00 00 01'],['9223372036854775807','7F FF FF FF FF FF FF FF'],['-9223372036854775808','80 00 00 00 00 00 00 00'],['-1','FF FF FF FF FF FF FF FF']]){
   assert.equal(hex(id,{value}),h);assert.equal(decodeDptHex(id,h).values.value,value);
  }
  for(const value of ['9223372036854775808','-9223372036854775809','1e3','1.5',''])assert.throws(()=>hex(id,{value}));
 }
});
test('Latin-1, status bits and scene status use the specified byte positions',()=>{
 assert.equal(hex('4.002',{text:'ÿ'}),'FF');assert.equal(decodeDptHex('4.002','A3').values.text,'£');assert.throws(()=>hex('4.002',{text:'€'}));
 for(let bit=0;bit<7;bit++)assert.equal(hex('21.601',{['b'+bit]:'1'}),(2**bit).toString(16).toUpperCase().padStart(2,'0'));
 assert.throws(()=>decodeDptHex('21.601','80'));assert.throws(()=>decodeDptHex('21.1201','08'));
 assert.equal(hex('26.001',{scene:'64',inactive:'1'}),'7F');assert.equal(hex('26.001',{scene:'1',inactive:'0'}),'00');assert.throws(()=>decodeDptHex('26.001','80'));
});
test('LTE mode delay, DALI diagnostics and colour validity have independent fields',()=>{
 assert.equal(hex('206.102',{delay:'300',mode:'4'}),'01 2C 04');assert.throws(()=>decodeDptHex('206.102','00 01 05'));
 assert.equal(hex('238.600',{ballast:'1',lamp:'0',address:'63'}),'BF');
 assert.equal(hex('242.600',{x:'0.5',y:'1',brightness:'50',colourValid:'1',brightnessValid:'1'}),'80 00 FF FF 80 03');
 assert.throws(()=>decodeDptHex('242.600','00 00 00 00 00 04'));
 assert.equal(hex('244.600',{mode:'5',switch:'1',inhibit:'1',ft:'2',dt:'1',pdt:'0',failure:'2'}),'53 92');
 for(const h of ['A0 00','04 00','00 C0','00 03'])assert.throws(()=>decodeDptHex('244.600',h));
});
test('Additional codecs expose source pages and keep parameter/LTE data out of telegram choices',()=>{
 assert.equal(Object.keys(EXPANDED_DPTS).length,265);
 for(const spec of Object.values(EXPANDED_DPTS))assert.ok(spec.sourcePages.length>0);
 for(const id of ['7.003','7.013','8.012','20.004','20.022','21.100','206.100','206.102','206.104','206.105'])assert.equal(DPT_INPUTS[id].telegramAllowed,false,id);
 assert.equal(DPT_INPUTS['243.600'],undefined);assert.ok(DPT_INPUTS['247.600']);assert.ok(DPT_INPUTS['248.600']);
});
test('Owner-reviewed converter examples encode and decode without inferred units',()=>{
 const testInfo={date:'2026-10-12',time:'15:20:00',working:'2',summer:'1',interval:'168',duration:'10800'};
 const expected='7E 0A 0C 2F 14 00 41 00 00 A8 2A 30';
 assert.equal(hex('247.600',testInfo),expected);assert.deepEqual(decodeDptHex('247.600',expected).values,testInfo);
 for(const timestamp of ['7E 0A 0C 2F 14 00 41 40','7E 0A 0C 2F 14 00 41 80','7E A0 0C 2F 14 00 41 00','7E 0A 0C 38 00 00 41 00','7E 0A 0C 4F 14 00 41 00'])assert.throws(()=>decodeDptHex('247.600',timestamp+' 00 A8 2A 30'));
 assert.throws(()=>hex('247.600',{interval:'65536'}));assert.throws(()=>hex('247.600',{duration:'-1'}));
 const fixedInfo={validity:'1',minimum:'85',maximum:'254',durationRaw:'90',feature0:'1',feature3:'1',feature5:'1'};
 assert.equal(hex('248.600',fixedInfo),'01 55 FE 5A 29');assert.equal(decodeDptHex('248.600','01 55 FE 5A 29').values.durationRaw,'90');
 for(const raw of ['0','255'])assert.equal(decodeDptHex('248.600',hex('248.600',{durationRaw:raw,minimum:'255',maximum:'255'})).values.durationRaw,raw);
 assert.throws(()=>decodeDptHex('248.600','03 55 FE 5A 29'));assert.throws(()=>hex('248.600',{durationRaw:'256'}));
 for(let i=0;i<8;i++)assert.ok(hex('248.600',{['feature'+i]:'1'}).endsWith((2**i).toString(16).toUpperCase().padStart(2,'0')));
});
