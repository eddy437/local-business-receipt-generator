const profiles = [
  ['0000ff00-0000-1000-8000-00805f9b34fb','0000ff02-0000-1000-8000-00805f9b34fb'],
  ['000018f0-0000-1000-8000-00805f9b34fb','00002af1-0000-1000-8000-00805f9b34fb'],
  ['0000ffe0-0000-1000-8000-00805f9b34fb','0000ffe1-0000-1000-8000-00805f9b34fb'],
  ['6e400001-b5a3-f393-e0a9-e50e24dcca9e','6e400002-b5a3-f393-e0a9-e50e24dcca9e']
];
export async function connectPrinter(mode, options, lost) {
  if (mode === 'classic') {
    if(!navigator.serial) throw Error('Open localhost in desktop Chrome and pair your printer in Bluetooth settings first.');
    const port=await navigator.serial.requestPort();
    await port.open({baudRate:9600});
    const gone=()=>lost();
    port.addEventListener('disconnect',gone);
    return {name:'Serial printer', model:options.label || 'Unavailable via serial', method:'Bluetooth / serial', async send(data){
      const writer=port.writable.getWriter();
      try {await writer.write(data);} finally {writer.releaseLock();}
    },async close(){port.removeEventListener('disconnect',gone); await port.close();}};
  }
  if(!navigator.bluetooth) throw Error('This browser does not offer Web Bluetooth. Try desktop Chrome or system printing.');
  const custom = options.service.trim() || options.characteristic.trim();
  if(custom && !(options.service.trim() && options.characteristic.trim())) throw Error('Enter both UUIDs from the printer manual.');
  const pairs=custom ? [[options.service.trim().toLowerCase(),options.characteristic.trim().toLowerCase()]] : profiles;
  const device=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:['device_information',...pairs.map(p=>p[0])]});
  try {
    const server=await device.gatt.connect();
    let channel;
    for(const [svc,chr] of pairs){
      try {
        const candidate=await (await server.getPrimaryService(svc)).getCharacteristic(chr);
        if(candidate.properties.write || candidate.properties.writeWithoutResponse){channel=candidate;break;}
      } catch { /* Try the next supported printer profile. */ }
    }
    if(!channel) throw Error('No supported print channel found. Enter the ESC/POS write UUIDs from the manual or try Bluetooth Classic.');
    let model='';
    try {
      const info=await server.getPrimaryService('device_information');
      const data=await (await info.getCharacteristic('model_number_string')).readValue();
      model=new TextDecoder().decode(data).replace(/\0/g,'').trim();
    } catch { /* Model information is optional on BLE devices. */ }
    device.addEventListener('gattserverdisconnected',lost);
    return {name:device.name || 'BLE printer',model:model || options.label || 'Not reported',method:'Bluetooth LE',
      async send(data){
        for(let i=0;i<data.length;i+=20){
          const chunk=data.slice(i,i+20);
          if(channel.properties.write) await channel.writeValueWithResponse(chunk);
          else {await channel.writeValueWithoutResponse(chunk);await new Promise(r=>setTimeout(r,25));}
        }
      },async close(){device.removeEventListener('gattserverdisconnected',lost);device.gatt.disconnect();}
    };
  } catch(e){device.gatt?.disconnect();throw e;}
}
