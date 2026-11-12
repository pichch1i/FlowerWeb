from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "artifacts"
OUT_DIR.mkdir(parents=True, exist_ok=True)
PNG = OUT_DIR / "bloomscape-system-architecture-ch3.png"
PDF = OUT_DIR / "bloomscape-system-architecture-ch3.pdf"

W, H = 1654, 2339  # A4 ratio at 150 dpi
img = Image.new("RGB", (W, H), "#F7F3EC")
d = ImageDraw.Draw(img)

font_path = ROOT / "FrontEnd/src/assets/font/Prompt/Prompt-Regular.ttf"
font_bold_path = ROOT / "FrontEnd/src/assets/font/Prompt/Prompt-SemiBold.ttf"
font_small = ImageFont.truetype(str(font_path), 27)
font_body = ImageFont.truetype(str(font_path), 31)
font_box = ImageFont.truetype(str(font_path), 34)
font_title = ImageFont.truetype(str(font_bold_path), 51)
font_subtitle = ImageFont.truetype(str(font_path), 29)
font_caption = ImageFont.truetype(str(font_path), 27)
font_note = ImageFont.truetype(str(font_path), 25)

NAVY = "#244E70"
GREEN = "#2E7D5B"
ORANGE = "#CF7044"
PURPLE = "#7057A3"
INK = "#3D2524"
MUTED = "#6F625C"
LINE = "#7A6E67"
WHITE = "#FFFDF8"

def center_text(box, text, font, fill=INK, spacing=5):
    x0, y0, x1, y1 = box
    lines = text.split("\n")
    heights = [d.textbbox((0, 0), line, font=font)[3] for line in lines]
    total = sum(heights) + spacing * (len(lines) - 1)
    y = (y0 + y1 - total) / 2
    for line, height in zip(lines, heights):
        bbox = d.textbbox((0, 0), line, font=font)
        x = (x0 + x1 - (bbox[2] - bbox[0])) / 2
        d.text((x, y), line, font=font, fill=fill)
        y += height + spacing

def box(x, y, w, h, title, body, fill, outline, title_fill=INK):
    d.rounded_rectangle((x, y, x+w, y+h), radius=28, fill=fill, outline=outline, width=5)
    center_text((x+20, y+18, x+w-20, y+h-20), title + "\n" + body, font_box, title_fill)

def arrow(x1, y1, x2, y2, color=LINE, width=7, dashed=False):
    d.line((x1, y1, x2, y2), fill=color, width=width)
    import math
    ang = math.atan2(y2-y1, x2-x1)
    size = 23
    pts = [(x2, y2),
           (x2-size*math.cos(ang-0.45), y2-size*math.sin(ang-0.45)),
           (x2-size*math.cos(ang+0.45), y2-size*math.sin(ang+0.45))]
    d.polygon(pts, fill=color)

def label(x, y, text, fill=MUTED):
    d.text((x, y), text, font=font_small, fill=fill)

# Header
d.text((W//2, 76), "แผนภาพสถาปัตยกรรมระบบ Bloomscape", font=font_title, fill=NAVY, anchor="ma")
d.text((W//2, 145), "การไหลของข้อมูลแบบสอบถามและสัญญาณจากอุปกรณ์ตรวจจับ", font=font_subtitle, fill=MUTED, anchor="ma")
d.line((90, 205, W-90, 205), fill="#D6C9BC", width=3)

# ระบบที่ 1: แบบสอบถามและ Interactive Media ผ่านโปรเจกเตอร์
d.rounded_rectangle((70, 270, W-70, 1125), radius=30, fill="#FFFCF7", outline="#D8C9BC", width=4)
d.text((105, 295), "ระบบที่ 1: FlowerWeb / Supabase / TouchDesigner / โปรเจกเตอร์", font=font_box, fill=NAVY)
web = (105, 405, 430, 695)
supabase = (515, 380, 900, 735)
td1 = (985, 405, 1320, 695)
projector = (1390, 405, 1600, 695)
orbbec = (985, 790, 1320, 1035)
box(web[0], web[1], web[2]-web[0], web[3]-web[1], "เว็บไซต์", "FlowerWeb\nแบบสอบถาม 7 ข้อ\nผลลัพธ์ดอกไม้", "#FFF8F1", ORANGE)
box(supabase[0], supabase[1], supabase[2]-supabase[0], supabase[3]-supabase[1], "Supabase", "quiz-api\nPostgreSQL\nquiz_submissions\nusage_logs\ntouchdesigner_events", "#EEF8F1", GREEN)
box(td1[0], td1[1], td1[2]-td1[0], td1[3]-td1[1], "TouchDesigner", "รับ result event\nประมวลผลภาพ\nควบคุม Interactive Media", "#F3EEFF", PURPLE)
box(projector[0], projector[1], projector[2]-projector[0], projector[3]-projector[1], "โปรเจกเตอร์", "แสดงผลภาพ\nต่อผู้เข้าร่วม", "#FFF4E8", ORANGE)
box(orbbec[0], orbbec[1], orbbec[2]-orbbec[0], orbbec[3]-orbbec[1], "Orbbec", "ตรวจจับภาพ\nตำแหน่ง\nการเคลื่อนไหว", "#EEF6F4", GREEN)
arrow(web[2], 550, supabase[0], 550, ORANGE); label(430, 510, "JSON / API")
arrow(supabase[2], 550, td1[0], 550, GREEN); label(900, 510, "result event")
arrow(td1[2], 550, projector[0], 550, PURPLE); label(1310, 510, "ภาพ")
arrow(orbbec[0]+165, orbbec[1], td1[0]+165, td1[3], GREEN); label(1120, 725, "สัญญาณภาพ / ตำแหน่ง", GREEN)

# ระบบที่ 2: เซนเซอร์ระยะและเสียงสำหรับการแสดงผลบนจอทีวี
d.rounded_rectangle((70, 1170, W-70, 1815), radius=30, fill="#FFFCF7", outline="#D8C9BC", width=4)
d.text((105, 1195), "ระบบที่ 2: Ultrasonic Sensor / Arduino / Ableton / TouchDesigner / จอทีวี", font=font_box, fill=NAVY)
ultra = (105, 1325, 400, 1585)
arduino = (500, 1325, 790, 1585)
ableton = (890, 1325, 1180, 1585)
td2 = (1280, 1325, 1555, 1585)
tv = (720, 1640, 1010, 1785)
box(ultra[0], ultra[1], ultra[2]-ultra[0], ultra[3]-ultra[1], "Ultrasonic Sensor", "ตรวจวัดระยะ\nการเข้าใกล้พื้นที่", "#FFF6EA", ORANGE)
box(arduino[0], arduino[1], arduino[2]-arduino[0], arduino[3]-arduino[1], "Arduino", "อ่านค่าเซนเซอร์\nและส่งสัญญาณ", "#EEF6F4", GREEN)
box(ableton[0], ableton[1], ableton[2]-ableton[0], ableton[3]-ableton[1], "Ableton", "ประมวลผลและ\nควบคุมเสียง", "#FFF8F1", ORANGE)
box(td2[0], td2[1], td2[2]-td2[0], td2[3]-td2[1], "TouchDesigner", "รับข้อมูลระยะ\nสร้างภาพตอบสนอง", "#F3EEFF", PURPLE)
box(tv[0], tv[1], tv[2]-tv[0], tv[3]-tv[1], "จอทีวี", "แสดงผลภาพ\nและเสียง", "#F1F6FB", NAVY)
arrow(ultra[2], 1455, arduino[0], 1455, ORANGE); arrow(arduino[2], 1455, ableton[0], 1455, GREEN); arrow(ableton[2], 1455, td2[0], 1455, ORANGE); arrow(td2[0]+137, td2[3], tv[0]+145, tv[1], PURPLE)
label(675, 1280, "ค่าระยะ")
label(1060, 1280, "ข้อมูลเสียง")
label(1310, 1600, "ภาพ / เสียง")

# Admin side channel for system 1
admin = (105, 820, 430, 1035)
box(admin[0], admin[1], admin[2]-admin[0], admin[3]-admin[1], "หน้า Admin", "ดูผลการตอบ\nและ Usage Log\nผ่าน admin-api", "#F1F6FB", NAVY)
arrow(admin[2], 900, supabase[0], 700, NAVY, width=6); label(430, 800, "admin-api", NAVY)

# Bottom explanation panel
d.rounded_rectangle((90, 1840, W-90, 2160), radius=28, fill="#FFFDF8", outline="#D6C9BC", width=4)
d.text((125, 1880), "ลำดับการทำงานโดยสรุป", font=font_box, fill=NAVY)
summary = "ระบบที่ 1: เว็บไซต์และ Supabase ส่งผลไปยัง TouchDesigner\nเพื่อควบคุมภาพบนโปรเจกเตอร์ โดยรับสัญญาณจาก Orbbec\nระบบที่ 2: Ultrasonic Sensor → Arduino → Ableton → TouchDesigner\nเพื่อแสดงภาพและเสียงบนจอทีวี"
center_text((125, 1950, W-125, 2115), summary, font_note, INK, spacing=9)

# Footer note and caption
note = "หมายเหตุ: Supabase เป็นแหล่งจัดเก็บข้อมูลหลัก ส่วน TouchDesigner เป็นตัวกลาง\nสำหรับประมวลผลและแสดงผล Interactive Media โดยไม่รับข้อมูลผู้เล่นโดยตรงจากหน้าเว็บ"
center_text((100, 2185, W-100, 2260), note, font_note, MUTED, spacing=6)
d.text((W//2, 2310), "รูปที่ 3.x แผนภาพสถาปัตยกรรมระบบเว็บไซต์ Bloomscape และระบบ Interactive Media", font=font_caption, fill=INK, anchor="ms")

img.save(PNG, dpi=(150, 150))
img.save(PDF, "PDF", resolution=150.0)
print(PNG)
print(PDF)
