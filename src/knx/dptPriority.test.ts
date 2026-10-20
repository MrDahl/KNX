import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {DPT_INPUTS,defaults,encodeDpt} from './dptCodec';
import {decodeDptHex,payloadHex} from './dptDecode';
import {EXPANDED_DPTS,expandedFields} from './dptExpandedCodec';
import {dptSummary} from '../dptPresentation';
import {dptInterpretation} from './dptInterpretation';
const hex=(id:string,v:Record<string,string>)=>payloadHex(encodeDpt(id,{...defaults(id),...v}));
test('DALI diagnostic bit positions and device/group address bounds',()=>{
 assert.equal(hex('237.600',{converter:'1',ballast:'1',lamp:'1',read:'1',group:'1',address:'15'}),'07 CF');
 assert.equal(hex('237.600',{address:'63'}),'00 3F');
 assert.equal(decodeDptHex('237.600','04 00').values.converter,'1');
 for(const h of ['08 00','00 50','80 00'])assert.throws(()=>decodeDptHex('237.600',h));
});
test('Version magic/version/revision and the void marker',()=>{
 assert.equal(hex('217.001',{magic:'1',version:'2',revision:'3'}),'08 83');
 const v=decodeDptHex('217.001','FF FF').values;
 assert.deepEqual(v,{magic:'31',version:'31',revision:'63'});assert.match(dptInterpretation('217.001',v)!,/invalid/);
});
test('Alarm attributes and status use separate octets and reject reserved/dependent flags',()=>{
 assert.equal(hex('219.001',{log:'18',priority:'3',area:'20',errorClass:'42',ack:'1',timestamp:'1',text:'1',errorCode:'1',locked:'1',unack:'1',alarm:'1'}),'12 03 14 2A 0F 07');
 for(const h of ['00 04 00 00 00 00','00 00 02 00 00 00','00 00 00 00 10 00','00 00 00 00 00 08','00 00 00 00 00 02'])assert.throws(()=>decodeDptHex('219.001',h));
});
test('Scaling-speed and step-time examples from the standard, plus next tariff',()=>{
 assert.equal(hex('225.001',{time:'4',value:'100'}),'00 28 FF');
 assert.equal(hex('225.002',{time:'15',value:'100'}),'00 0F FF');
 assert.equal(hex('225.003',{delay:'300',tariff:'254'}),'01 2C FE');
 assert.throws(()=>decodeDptHex('225.001','00 00 FF'));assert.throws(()=>decodeDptHex('225.002','00 01 00'));assert.throws(()=>decodeDptHex('225.003','00 00 FF'));
});
test('Scene configuration, cyclic activation and blind status wire order',()=>{
 assert.equal(hex('238.001',{scene:'64',storage:'1',activation:'1'}),'FF');
 assert.equal(hex('239.001',{value:'100',active:'1'}),'FF 01');
 assert.equal(hex('240.800',{height:'100',slats:'0',slatsValid:'1',heightValid:'0'}),'FF 00 02');
 assert.equal(hex('241.800',{height:'100',slats:'0',heightValid:'1',slatsValid:'1',drive:'1',failure:'1',upper:'1'}),'FF 00 C4 09');
 for(const [id,h] of [['239.001','00 02'],['240.800','00 00 04'],['241.800','00 00 08 00']])assert.throws(()=>decodeDptHex(id,h));
});
test('Z8 integer/scaled encodings do not masquerade as KNX floating point',()=>{
 for(const [id,value,want] of [['202.001','100','64 00'],['203.014','1000','03 E8 00'],['203.015','0.05','00 01 00'],['203.101','1.23','00 7B 00'],['203.102','0.05','00 01 00'],['205.100','-0.02','FF FF 00'],['205.017','327.67','7F FF 00'],['218.001','-1','FF FF FF FF 00'],['218.002','-0.0001','FF FF FF FF 00']]){
  assert.equal(hex(id,{value}),want,id);assert.equal(decodeDptHex(id,want).values.value,value,id);
 }
 assert.throws(()=>hex('203.102',{value:'1400.05'}));assert.throws(()=>hex('204.001',{value:'101'}));assert.throws(()=>hex('205.100',{value:'0.01'}));
});
test('Z8 failure, overridden and out-of-service payloads preserve their distinct meanings',()=>{
 assert.equal(hex('205.100',{z8Status:'2',faultCode:'2'}),'00 02 02');
 assert.equal(decodeDptHex('205.100','00 02 02').values.faultCode,'2');
 assert.equal(decodeDptHex('205.100','00 02 06').values.value,'0.04');
 assert.equal(hex('205.100',{z8Status:'1',rawMain:'65535'}),'FF FF 01');
 assert.equal(decodeDptHex('205.100','FF FF 01').values.rawMain,'65535');
 for(let status=0;status<256;status++){
  const bytes=`00 00 ${status.toString(16).padStart(2,'0')}`;
  if(status>31||((status&1)&&(status&6)))assert.throws(()=>decodeDptHex('205.100',bytes));
  else assert.equal(payloadHex(encodeDpt('205.100',decodeDptHex('205.100',bytes).values)),bytes.toUpperCase());
 }
 assert.throws(()=>decodeDptHex('205.100','00 03 02'));
});
test('Z8 command interpretation is explicit and handles ignored main fields',()=>{
 const context={z8Mode:'1'};
 for(let command=0;command<7;command++){
  const raw=['0','1','4'].includes(String(command))?'00 64':'FF FF';
  const h=`${raw} 0${command}`,v=decodeDptHex('205.100',h,context).values;
  assert.equal(v.z8Mode,'1');assert.equal(payloadHex(encodeDpt('205.100',v)),h);
 }
 assert.throws(()=>decodeDptHex('205.100','00 00 07',context));
 const v=decodeDptHex('205.100','FF FF 02',context).values;
 assert.equal(v.rawMain,'65535');assert.match(dptSummary('205.100',encodeDpt('205.100',v),v),/Release/);
 assert.ok(!expandedFields('205.100',v)!.some(f=>f.key==='value'||f.key==='z8Status'));
});
test('Metering VIF codes and signed counts, including extended VIFE mapping',()=>{
 assert.equal(hex('229.001',{value:'-123',vif:'128'}),'FF FF FF 85 80 00');
 assert.equal(decodeDptHex('229.001','FF FF FF 85 80 00').values.value,'-123');
 const codes=DPT_INPUTS['229.001'].fields.find(f=>f.key==='vif')!.optionValues!;
 for(let n=0;n<256;n++){
  const h=`00 00 00 00 ${n.toString(16).padStart(2,'0')} 00`;
  if(codes.includes(n))assert.equal(decodeDptHex('229.001',h).values.vif,String(n));
  else assert.throws(()=>decodeDptHex('229.001',h));
 }
});
test('All new Z8 types are excluded from ordinary group telegrams',()=>{
 const ids=Object.entries(EXPANDED_DPTS).filter(([,s])=>s.z8).map(([id])=>id);
 assert.equal(ids.length,42);
 for(const id of ids){assert.equal(DPT_INPUTS[id].telegramAllowed,false);assert.equal(decodeDptHex(id,hex(id,{})).values.z8Mode,'0');}
});
