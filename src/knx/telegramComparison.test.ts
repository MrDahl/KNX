import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {compareBytes,snapshot} from './telegramComparison';
import {buildStandardGroupTelegram} from '../components/TelegramVisualizer';
import {APCICode,type TelegramParams} from '../types';
const params:TelegramParams={repeatFlag:'1',targetType:'1',command:APCICode.GroupValueWrite,source:{area:1,line:1,device:10},destination:{main:1,middle:0,sub:1},hopCount:6,priority:'11',dptType:'1.001',ackType:'CC'};
test('comparison aligns checksum by role for added and removed payload octets',()=>{
 const a=buildStandardGroupTelegram(params,'1').cards;
 const b=buildStandardGroupTelegram({...params,dptType:'9.001'},'0000011111010000').cards;
 for(const [before,after] of [[a,b],[b,a]]){
  const rows=compareBytes(before,after);
  assert.equal(rows.length,11);assert.equal(rows.at(-1)?.before,before.at(-1));assert.equal(rows.at(-1)?.after,after.at(-1));
  assert.equal(rows[8].changed,true);assert.equal(rows[9].changed,true);
  assert.equal(rows.filter(r=>r.check).length,1);
 }
});
test('pinned snapshots do not change when nested input or bytes are subsequently edited',()=>{
 const p=structuredClone(params),bytes=buildStandardGroupTelegram(p,'1').cards,values={value:'1'};
 const pinned=snapshot(bytes,p,'1',values);p.source.device=30;values.value='0';bytes[0].hex='00';
 assert.equal(pinned.params.source.device,10);assert.equal(pinned.values.value,'1');assert.equal(pinned.bytes[0].hex,'BC');
});
