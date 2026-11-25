import test from 'node:test';
import assert from 'node:assert/strict';
import {totals,paise,receiptText} from '../src/bill.js';
const items=['2499.99','3750','1800.50'].map((price,i)=>({name:'Shoe '+(i+1),price,qty:'1'}));
test('three pairs with cash and change',()=>{
  const t=totals(items,'8500');
  assert.equal(t.total,805049);assert.equal(t.change,44951);assert.ok(t.valid);
});
test('quantity and invalid inputs',()=>{
  assert.equal(totals([{...items[0],qty:'2'}],'5000').total,499998);
  for(const s of ['-2','2.555','','NaN','1e5'])assert.equal(paise(s),null);
  assert.equal(totals(items,'8000').valid,false);
  assert.equal(totals([{...items[0],name:''}],'5000').valid,false);
});
test('thermal text is bounded and neutralizes control characters',()=>{
  const b={items:[{...items[0],name:'a'.repeat(60)+'\x1b@'}],shop:'Shop',cash:'3000',id:'B-123',customer:'C-456',time:new Date()};
  const text=receiptText(b,32,true);assert.ok(text.includes(b.customer));assert.ok(!text.includes('\x1b'));
  assert.ok(text.split('\n').every(l=>l.length<=32));
});
test('sale just after midnight in Pakistan uses the saved date and time on both print routes',()=>{
  const b={items,shop:'Shop',cash:'8500',id:'B-1',customer:'C-1',time:'2026-11-24T19:05:00Z'};
  for(const direct of [true,false]){
    const text=receiptText(b,32,direct);
    assert.match(text,/Date +25 Nov 2026/);
    assert.match(text,/Time +12:05 AM PKT/);
  }
});
