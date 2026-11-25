export const contacts = [
  'WhatsApp: 0315-5702330',
  'Abdul Basit 0332-8860444',
  'Location: Shandar Chowk Jhelum'
];
export const policy = 'خریدا ہوا مال واپس نہیں ہوگا۔';

async function graphic(name, dots) {
  const response = await fetch('/receipt/'+name+'-'+dots+'.bin');
  if (!response.ok) throw Error('Could not load receipt artwork.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if(bytes[0]!==29 || bytes[1]!==118) throw Error('Invalid receipt artwork.');
  return bytes;
}
export async function thermalReceipt(body, columns) {
  const dots=columns===48 ? 576 : 384;
  const [header,notice]=await Promise.all([graphic('header',dots),graphic('policy',dots)]);
  const parts=[Uint8Array.of(27,64),header,new TextEncoder().encode(body+'\n'),notice,Uint8Array.of(10,10,10,10)];
  const output=new Uint8Array(parts.reduce((length,part)=>length+part.length,0));
  let offset=0;
  for(const part of parts){output.set(part,offset);offset+=part.length;}
  return output;
}
