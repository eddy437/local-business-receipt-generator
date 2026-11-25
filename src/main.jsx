import React,{useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {row,paise,totals,money,receiptText,saleStamp} from './bill';
import {connectPrinter} from './printer';
import {contacts,policy,thermalReceipt} from './stationery';
import './style.css';

const prefix='sole.receipt.';
function fresh(shop='Shoe Point'){
  const token=()=>crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase();
  return {shop,id:'B-'+token(),customer:'C-'+token(),time:new Date().toISOString(),items:[row()],cash:''};
}
function Modal({title,children,close}){
  const ref=useRef(null);
  React.useEffect(()=>{ref.current.showModal();},[]);
  return <dialog ref={ref} onCancel={e=>{e.preventDefault();close();}}><header><h2>{title}</h2><button aria-label="Close dialog" onClick={close}>×</button></header>{children}</dialog>;
}
function App(){
  const [bill,setBill]=useState(()=>fresh()),[locked,lock]=useState(false),[panel,show]=useState(''),[saved,setSaved]=useState([]);
  const [printer,setPrinter]=useState(null),[busy,work]=useState(''),[note,say]=useState(''),[error,fail]=useState('');
  const [mode,route]=useState('classic'),[width,resize]=useState(32);
  const [options,opts]=useState({service:'',characteristic:'',label:''});
  const gate=useRef(false);
  const [now,setNow]=useState(()=>Date.now());
  React.useEffect(()=>{
    if(locked)return;
    setNow(Date.now());
    const clock=setInterval(()=>setNow(Date.now()),1000);
    return ()=>clearInterval(clock);
  },[locked]);
  const stamp=saleStamp(locked ? bill.time : now);
  const t=totals(bill.items,bill.cash);
  const edit=(key,value)=>setBill(old=>({...old,[key]:value}));
  function item(id,key,value){setBill(old=>({...old,items:old.items.map(i=>i.id===id?{...i,[key]:value}:i)}));}
  function open(p){fail('');say('');show(p);}
  function history(){
    try{setSaved(Object.keys(localStorage).filter(k=>k.startsWith(prefix)).map(k=>JSON.parse(localStorage[k])).sort((a,b)=>b.time.localeCompare(a.time)));open('history');}
    catch{fail('Could not read this browser’s saved receipts.');}
  }
  async function connect(){
    if(gate.current)return;gate.current=true;work('Connecting');fail('');
    try {
      const p=await connectPrinter(mode,options,()=>{setPrinter(null);say('Printer disconnected.');});
      setPrinter(p);show('');say('Printer connected.');
    }catch(e){fail(e.name==='NotFoundError'?'No printer selected.':e.message);}
    finally{gate.current=false;work('');}
  }
  async function disconnect(){
    if(gate.current)return;gate.current=true;work('Disconnecting');
    try{await printer.close();setPrinter(null);say('Printer disconnected.');show('');}
    catch(e){fail(e.message);}finally{gate.current=false;work('');}
  }
  async function print(){
    if(gate.current || !t.valid)return;
    gate.current=true;work('Printing');fail('');say('');
    let snapshot=bill,recorded=locked;
    try{
      if(!locked){
        snapshot={...bill,shop:bill.shop.trim() || 'Shoe Point',time:new Date().toISOString()};
        localStorage.setItem(prefix+snapshot.id,JSON.stringify(snapshot));recorded=true;
        flushSync(()=>{setBill(snapshot);lock(true);});
      }
      if(printer){
        await printer.send(await thermalReceipt(receiptText(snapshot,width,true),width));say('Receipt sent to printer.');
      } else {await Promise.all(Array.from(document.querySelectorAll('.paper img'),img=>img.decode()));window.print();say('Print dialog closed. Your receipt is saved.');}
    }catch(e){fail(recorded?'Receipt saved. Check the paper before reprinting. '+e.message:'Could not save the sale on this device. Check browser storage and try again.');}
    finally{work('');gate.current=false;}
  }
  const next=()=>{setBill(fresh(bill.shop));lock(false);say('');fail('');};
  const draft=()=>!locked && (bill.cash || bill.items.some(i=>i.name || i.price));
  const status=<span className={'pill '+(printer?'online':'')}><i/>{printer?'Connected':'Disconnected'}</span>;
  return <><div className="shell"><nav><strong><img className="shopmark" src="/brand/shoe-point.png" alt=""/> SHOE POINT</strong><button onClick={history} disabled={!!busy}>Receipt history</button></nav>
  <main><div className="heading"><div><small>POINT OF SALE</small><h1>Checkout</h1></div><button disabled={!!busy} onClick={()=>open('printer')}>Printer settings</button></div>
  <section className="layout"><div className="card"><header><h2>Sale items</h2><span>{bill.items.length} {bill.items.length===1?'line':'lines'}</span></header>
  <fieldset disabled={locked || !!busy}><div className="rows">{bill.items.map((i,k)=><div className="item" key={i.id}>
    <label className="name">Item name<input aria-label={'Item '+(k+1)+' name'} placeholder="e.g. Leather loafer" maxLength={80} value={i.name} onChange={e=>item(i.id,'name',e.target.value)}/></label>
    <label>Pairs<input type="number" min="1" max="999" value={i.qty} onChange={e=>item(i.id,'qty',e.target.value)}/></label>
    <label>Price / pair (Rs)<input inputMode="decimal" placeholder="0.00" value={i.price} onChange={e=>item(i.id,'price',e.target.value)}/></label>
    <button className="remove" disabled={bill.items.length===1} aria-label={'Remove item '+(k+1)} onClick={()=>edit('items',bill.items.filter(x=>x.id!==i.id))}>×</button>
  </div>)}</div><button className="add" onClick={()=>edit('items',[...bill.items,row()])}>＋ Add item</button></fieldset>
  <hr/><div className="total"><strong>Bill total</strong><b>Rs {money(t.total)}</b></div>
  <div className="payment"><label>Cash received (Rs)<input disabled={locked || !!busy} inputMode="decimal" placeholder="0.00" value={bill.cash} onChange={e=>edit('cash',e.target.value)}/></label>
  <div><label>{t.change<0?'Amount due':'Change due'}</label><b>Rs {money(Math.abs(t.change))}</b></div></div>
  <button className="primary" disabled={!t.valid || !!busy} onClick={print}>{busy==='Printing'?'Printing…':locked?'Reprint receipt':'Print receipt'}</button>
  {locked?<button className="new" disabled={!!busy} onClick={next}>Start next sale</button>:<p className="hint">{!t.valid?'Enter a name, quantity, price and sufficient cash to print.':printer?'Ready to send to '+printer.name+'.':'Print using the system dialog or connect a Bluetooth printer.'}</p>}
  </div><aside><div className="previewhead"><small>RECEIPT PREVIEW</small><span>{locked?'Saved':'Draft'}</span></div><div className="paper" style={{'--roll-width':width===32?'48mm':'72mm'}}><img className="letterhead" src="/receipt/header.png" alt="Shoe Point · Nike, Jordan, adidas, Louis Vuitton, Clarks"/>{bill.shop && bill.shop.trim().toLowerCase()!=='shoe point' && <div className="paperbrand">{bill.shop}</div>}<div className="sliplabel">SALES RECEIPT</div>
  <dl><dt>Date</dt><dd>{stamp.day}</dd><dt>Time</dt><dd>{stamp.clock}</dd><dt>Customer ID</dt><dd>{bill.customer}</dd><dt>Bill ID</dt><dd>{bill.id}</dd></dl>
  <div className="receiptitems">{bill.items.map((i,k)=><div key={i.id}><span>{i.name.trim() || 'Item '+(k+1)}<em>{i.qty || '0'} × {money(paise(i.price) ?? 0)}</em></span><b>{money(t.lines[k] ?? 0)}</b></div>)}</div>
  <div className="rt"><strong>Total (PKR)</strong><strong>{money(t.total)}</strong></div><div className="rt"><span>Cash</span><span>{money(t.paid ?? 0)}</span></div><div className="rt"><span>Change</span><span>{money(Math.max(0,t.change))}</span></div><footer><p>Thank you for shopping with us!</p>{contacts.map(line=><div key={line}>{line}</div>)}<img className="policy" src="/receipt/policy.png" alt={policy} lang="ur" dir="rtl"/></footer></div>
  <div className="device"><div><strong>Receipt printer</strong>{status}</div><p>{printer?printer.name+' · Model: '+printer.model:'System print dialog available'}</p></div></aside></section>
  <div role="status">{note}</div>{!panel && error && <p role="alert">{error}</p>}
  </main></div>
  {panel==='printer' && <Modal title="Printer settings" close={()=>!busy && show('')}><div className="setting">{status}
  <label>Shop name<input disabled={locked} maxLength={50} value={bill.shop} onChange={e=>edit('shop',e.target.value)}/></label>
  <label>Paper width<select value={width} onChange={e=>resize(Number(e.target.value))}><option value={32}>58 mm · 32 columns</option><option value={48}>80 mm · 48 columns</option></select></label>
  {printer?<><p>{printer.name}<br/>Model: {printer.model}<br/>{printer.method}</p><button disabled={!!busy} onClick={disconnect}>Disconnect printer</button></>:<><label>Connection<select value={mode} onChange={e=>route(e.target.value)}><option value="classic">Bluetooth Classic / serial port</option><option value="ble">Bluetooth Low Energy (BLE)</option></select></label>
  <p>{mode==='classic'?'Pair the printer in Windows Bluetooth settings, then select its serial port.':'Turn on your BLE receipt printer and select its device name.'}</p>
  <label>Model from printer label (optional)<input value={options.label} onChange={e=>opts({...options,label:e.target.value})}/></label>
  {mode==='ble' && <details><summary>Custom BLE profile</summary>{['service','characteristic'].map(k=><label key={k}>{k==='service'?'Service UUID':'Write characteristic UUID'}<input value={options[k]} onChange={e=>opts({...options,[k]:e.target.value})}/></label>)}</details>}
  <button className="primary" disabled={!!busy} onClick={connect}>{busy || 'Connect printer'}</button></>}{error && <p role="alert">{error}</p>}</div></Modal>}
  {panel==='history' && <Modal title="Receipt history" close={()=>show('')}><p>Sales saved in this browser.</p>{!saved.length && <p>No receipts yet.</p>}{saved.map(s=><button className="history" key={s.id} onClick={()=>{if(draft() && !confirm('Discard the current draft and open this receipt?'))return;setBill(s);lock(true);show('');}}><strong>{s.id}</strong><b>Rs {money(totals(s.items,s.cash).total)}</b><span>{new Date(s.time).toLocaleString()}</span></button>)}</Modal>}
</>;
}
createRoot(document.getElementById('root')).render(<App/>);
