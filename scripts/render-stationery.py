"""Rebuild print artwork with Pillow (RAQM) and Noto Nastaliq Urdu installed."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import struct
root=Path(__file__).resolve().parents[1]/'public'
def artwork(name):
    img=Image.open(root/'brand'/(name+'.png')).convert('RGBA')
    img=img.crop(img.getchannel('A').getbbox())
    paper=Image.new('RGB',img.size,'white')
    paper.paste(img,mask=img.getchannel('A'))
    return paper.convert('L').point(lambda v: 255 if v>165 else v)
def fit(paper,img,box):
    x,y,w,h=box
    img=ImageOps.contain(img,(w,h),Image.Resampling.LANCZOS)
    paper.paste(img,(x+(w-img.width)//2,y+(h-img.height)//2))
def lettering(text,font,size,**kwargs):
    img=Image.new('L',(2000,350),255)
    ImageDraw.Draw(img).text((20,20),text,font=ImageFont.truetype(font,size),fill=0,**kwargs)
    return img.crop(ImageOps.invert(img).getbbox())
head=Image.new('L',(960,230),255)
fit(head,artwork('shoe-point'),(35,12,202,202))
fit(head,lettering('SHOE POINT','DejaVuSerif-Bold.ttf',100),(255,14,665,94))
for name,x,w in [('nike',262,118),('jordan',398,128),('adidas',548,98),('LV',672,63),('clarks',759,153)]:
    fit(head,artwork(name),(x,120,w,74))
notice=lettering('خریدا ہوا مال واپس نہیں ہوگا۔','NotoNastaliqUrdu-Regular.ttf',80,direction='rtl',language='ur')
foot=Image.new('L',(960,160),255)
fit(foot,notice,(65,10,830,140))
for name,img in [('header',head),('policy',foot)]:
    img.save(root/'receipt'/(name+'.png'))
    for dots in (384,576):
        small=img.resize((dots,round(img.height*dots/img.width)),Image.Resampling.LANCZOS)
        # ESC/POS uses one set bit for each black dot, highest bit first.
        bits=small.point(lambda v:255 if v<175 else 0,mode='1').tobytes()
        data=b'\x1dv0\x00'+struct.pack('<HH',dots//8,small.height)+bits
        (root/'receipt'/f'{name}-{dots}.bin').write_bytes(data)
