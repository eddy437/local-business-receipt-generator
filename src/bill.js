import {contacts} from './stationery.js';
export function paise(value) {
  const s = String(value).trim();
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null;
  const [whole, fraction = ''] = s.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export const money = n => (n / 100).toLocaleString('en-PK', {minimumFractionDigits:2, maximumFractionDigits:2});
export const row = () => ({id:crypto.randomUUID(),name:'',qty:'1',price:''});
export function totals(items, cash) {
  const lines = items.map(i => {
    const p = paise(i.price), q = Number(i.qty);
    return p > 0 && Number.isInteger(q) && q > 0 && q <= 999 ? p * q : null;
  });
  const total = lines.reduce((a,b)=>a+(b ?? 0),0);
  const paid = paise(cash);
  const complete = items.length > 0 && items.every((i,k)=>i.name.trim() && lines[k] !== null);
  return {lines,total,paid,change:(paid ?? 0)-total,valid:complete && paid !== null && paid >= total};
}
const dateFormat = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Karachi', day:'2-digit', month:'short', year:'numeric'});
const timeFormat = new Intl.DateTimeFormat('en-US', {timeZone:'Asia/Karachi', hour:'2-digit', minute:'2-digit', hour12:true});
export function saleStamp(instant) {
  const date = new Date(instant);
  return {day:dateFormat.format(date), clock:timeFormat.format(date)+' PKT'};
}
export function receiptText(b, width=32, ascii=false) {
  const clean = s => {
    const text = String(s).replace(/[\x00-\x1f\x7f-\x9f]/g,' ').trim();
    return ascii ? text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,'?') : text;
  };
  const wrap = s => Array.from(clean(s)).reduce((lines,c,k)=>{
    if(k % width === 0) lines.push('');
    lines[lines.length-1] += c;
    return lines;
  },[]).join('\n');
  const pair = (a,v) => a.length+v.length+1 <= width ? a + ' '.repeat(width-a.length-v.length)+v : a+'\n'+v.padStart(width);
  const t=totals(b.items,b.cash), bar='-'.repeat(width);
  const stamp = saleStamp(b.time);
  return [...(b.shop.trim().toLowerCase()==='shoe point'?[]:[wrap(b.shop)]),'SALES RECEIPT',bar,pair('Date',stamp.day),pair('Time',stamp.clock),'Customer: '+b.customer,'Bill: '+b.id,bar,
    ...b.items.flatMap((i,k)=>[wrap(i.name || 'Item'),pair(i.qty+' x '+money(paise(i.price) ?? 0),money(t.lines[k] ?? 0))]),bar,
    pair('TOTAL PKR',money(t.total)),pair('Cash received',money(t.paid ?? 0)),pair('Change',money(Math.max(0,t.change))),bar,'Thank you for shopping with us!',...contacts].join('\n');
}
