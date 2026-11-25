import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {contacts,thermalReceipt} from '../src/stationery.js';
import {receiptText} from '../src/bill.js';

test('both thermal roll sizes send header, shop contacts and Urdu artwork',async t=>{
  t.mock.method(globalThis,'fetch',async path=>new Response(await readFile(new URL('../public'+path,import.meta.url))));
  const sale={id:'B-12',customer:'C-12',shop:'Shoe Point',items:[],cash:'0',time:new Date()};
  for(const columns of [32,48]){
    const text=receiptText(sale,columns,true),data=await thermalReceipt(text,columns);
    for(const line of contacts)assert.ok(text.includes(line));
    let pos=2;
    function raster(){
      assert.deepEqual([...data.slice(pos,pos+4)],[29,118,48,0]);
      const bytesAcross=data[pos+4]+256*data[pos+5],rows=data[pos+6]+256*data[pos+7];
      assert.equal(bytesAcross,columns===32?48:72);assert.ok(rows>20);
      pos+=8+bytesAcross*rows;
    }
    raster();const body=new TextEncoder().encode(text+'\n');
    assert.deepEqual(data.slice(pos,pos+body.length),body);pos+=body.length;
    raster();assert.deepEqual([...data.slice(pos)],[10,10,10,10]);
  }
});
