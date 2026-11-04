import fs from 'node:fs/promises'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const outputDir = '/Users/pichch1i/FlowerWeb/outputs'
const outputPath = `${outputDir}/Bloomscape_participant_data_template.xlsx`

const workbook = Workbook.create()
const data = workbook.worksheets.add('Participant_Data')
const guide = workbook.worksheets.add('Field_Guide_Ethics')

for (const sheet of [data, guide]) {
  sheet.showGridLines = false
}

// Participant data template. No fabricated participant records are included.
data.getRange('A1:Q1').merge()
data.getRange('A1').values = [['Bloomscape: ตารางข้อมูลผู้เข้าร่วมแบบสอบถาม']]
data.getRange('A1:Q1').format = {
  fill: '#244A43',
  font: { bold: true, color: '#FFFFFF', size: 14 },
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
}
data.getRange('A2:Q2').merge()
data.getRange('A2').values = [['ไฟล์นี้เป็นแม่แบบสำหรับบันทึกข้อมูลวิจัย ห้ามใส่ข้อมูลจริงก่อนมีเอกสารชี้แจงและแบบยินยอมที่ได้รับอนุมัติ']]
data.getRange('A2:Q2').format = {
  fill: '#FFF2CC',
  font: { italic: true, color: '#7F6000' },
  wrapText: true,
}

const headers = [[
  'ลำดับ', 'submissionId', 'วันเวลาที่ส่ง', 'ชื่อผู้ตอบ/รหัสแทนตัวตน',
  'อายุ (ปี)', 'เพศ*', 'สถานะ*', 'อาชีพ', 'ความยินยอม',
  'ผลอารมณ์', 'ดอกไม้', 'ชื่อเล่นดอกไม้', 'ความคิดเห็น',
  'คำตอบข้อ 1–7 (JSON)', 'วันที่สร้างข้อมูล', 'หมายเหตุด้านจริยธรรม', 'แหล่งข้อมูล',
]]
data.getRange('A4:Q4').values = headers
data.getRange('A4:Q4').format = {
  fill: '#D9EAD3',
  font: { bold: true, color: '#1F2937' },
  wrapText: true,
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  borders: { preset: 'all', style: 'thin', color: '#AAB7B2' },
}

const emptyRows = Array.from({ length: 30 }, (_, i) => [i + 1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, ''])
data.getRange('A5:Q34').values = emptyRows
data.getRange('A5:Q34').format = {
  borders: { preset: 'all', style: 'thin', color: '#D9E2DE' },
  verticalAlignment: 'center',
  wrapText: true,
}
data.getRange('C5:C34').setNumberFormat('yyyy-mm-dd hh:mm')
data.getRange('O5:O34').setNumberFormat('yyyy-mm-dd hh:mm')
data.getRange('E5:E34').setNumberFormat('0')
data.getRange('E5:E34').dataValidation = { rule: { type: 'whole', operator: 'between', formula1: 13, formula2: 120 } }
data.getRange('F5:F34').dataValidation = { rule: { type: 'list', values: ['หญิง', 'ชาย', 'ไม่ระบุ', 'อื่น ๆ', 'ไม่ประสงค์ตอบ'] } }
data.getRange('G5:G34').dataValidation = { rule: { type: 'list', values: ['นักเรียน/นักศึกษา', 'พนักงาน/ลูกจ้าง', 'ประกอบอาชีพอิสระ', 'ข้าราชการ/รัฐวิสาหกิจ', 'ว่างงาน', 'อื่น ๆ', 'ไม่ประสงค์ตอบ'] } }
data.getRange('I5:I34').dataValidation = { rule: { type: 'list', values: ['ยินยอม', 'ไม่ยินยอม'] } }
data.freezePanes.freezeRows(4)
const widths = [8, 38, 20, 28, 12, 14, 24, 24, 16, 16, 22, 20, 38, 42, 20, 34, 26]
widths.forEach((width, i) => data.getRangeByIndexes(0, i, 1, 1).format.columnWidth = width)
data.getRange('A1:Q2').format.rowHeight = 28
data.getRange('A4:Q4').format.rowHeight = 42

// Documentation sheet: current fields vs proposed fields and ethics correction.
guide.getRange('A1:F1').merge()
guide.getRange('A1').values = [['คู่มือฟิลด์ข้อมูลและแนวทางด้านจริยธรรมการวิจัย']]
guide.getRange('A1:F1').format = {
  fill: '#244A43', font: { bold: true, color: '#FFFFFF', size: 14 },
  horizontalAlignment: 'center', verticalAlignment: 'center',
}
guide.getRange('A3:F3').values = [['ฟิลด์', 'สถานะในโปรเจกต์ปัจจุบัน', 'ความหมาย', 'จำเป็นต้องขอความยินยอม', 'แนวทางคุ้มครองข้อมูล', 'แหล่งอ้างอิงในระบบ']]
guide.getRange('A3:F3').format = { fill: '#D9EAD3', font: { bold: true }, wrapText: true, borders: { preset: 'all', style: 'thin', color: '#AAB7B2' } }
guide.getRange('A4:F12').values = [
  ['submissionId', 'มี', 'รหัสอ้างอิงการตอบแบบสอบถาม', 'ไม่ระบุตัวบุคคลโดยตรง', 'ใช้แทนการเปิดเผยชื่อในงานวิเคราะห์', 'quiz_submissions'],
  ['ชื่อผู้ตอบ', 'มีในระบบ', 'ข้อมูลส่วนบุคคลโดยตรง', 'ต้องขอ', 'ควรใช้รหัสแทนตัวตนเมื่อส่งออกข้อมูล', 'full_name'],
  ['อายุ', 'มี', 'อายุของผู้ตอบ ช่วง 13–120 ปี', 'ต้องขอ', 'รายงานเป็นช่วงอายุเมื่อเหมาะสม', 'age'],
  ['เพศ', 'ยังไม่มี', 'ข้อมูลประชากรศาสตร์ที่เสนอให้เพิ่ม', 'ต้องขอ', 'เพิ่มตัวเลือกไม่ระบุ/ไม่ประสงค์ตอบ', 'ต้องเพิ่ม schema และฟอร์ม'],
  ['สถานะ', 'ยังไม่มี', 'สถานะการศึกษา/การทำงานที่เสนอให้เพิ่ม', 'ต้องขอ', 'กำหนดตัวเลือกให้ชัดและเปิดทางเลือกอื่น ๆ', 'ต้องเพิ่ม schema และฟอร์ม'],
  ['อาชีพ', 'มี', 'อาชีพของผู้ตอบ', 'ต้องขอ', 'จำกัดความยาวและหลีกเลี่ยงรายละเอียดเกินจำเป็น', 'occupation'],
  ['ความยินยอม', 'มี', 'การยอมรับประกาศความเป็นส่วนตัว', 'ต้องมี', 'บันทึกเวลาและเวอร์ชันประกาศ', 'consent_accepted'],
  ['คำตอบ/ผลลัพธ์', 'มี', 'คำตอบ 7 ข้อและผลอารมณ์/ดอกไม้', 'ต้องขอ', 'ใช้เพื่อวัตถุประสงค์ที่แจ้งไว้เท่านั้น', 'answers, result_emotion, flower'],
  ['Usage Log', 'มี', 'ข้อมูลการใช้งาน เช่น page view และ button click', 'ต้องแจ้งให้ทราบ', 'เก็บเท่าที่จำเป็นและไม่ใช้ติดตามเกินวัตถุประสงค์', 'usage_logs'],
]
guide.getRange('A4:F12').format = { wrapText: true, verticalAlignment: 'center', borders: { preset: 'all', style: 'thin', color: '#D9E2DE' } }

guide.getRange('A15:F15').merge()
guide.getRange('A15').values = [['ข้อความแก้ไขสำหรับวิทยานิพนธ์: “ไม่มีเรื่องจริยธรรมวิจัย”']]
guide.getRange('A15:F15').format = { fill: '#FCE4D6', font: { bold: true, color: '#9C0006' } }
guide.getRange('A16:F18').merge()
guide.getRange('A16').values = [['ไม่ควรเขียนว่าโครงงาน “ไม่มีจริยธรรมการวิจัย” เนื่องจากระบบมีการเก็บข้อมูลส่วนบุคคลและข้อมูลการใช้งานของผู้ตอบ ควรระบุว่าโครงงานดำเนินการโดยคำนึงถึงหลักจริยธรรม ได้แก่ การชี้แจงวัตถุประสงค์ การขอความยินยอมโดยสมัครใจ การเก็บข้อมูลเท่าที่จำเป็น การรักษาความลับ การใช้รหัสแทนตัวตน และการให้ผู้ตอบยุติการตอบได้โดยไม่เสียสิทธิ์ ทั้งนี้ หากข้อมูลถูกนำไปใช้เพื่อการวิจัยกับมนุษย์ ควรตรวจสอบและขอการรับรองจากคณะกรรมการจริยธรรมการวิจัยในมนุษย์ของสถาบันก่อนเก็บข้อมูลจริง']]
guide.getRange('A16:F18').format = { fill: '#FFF2CC', wrapText: true, verticalAlignment: 'center', borders: { preset: 'all', style: 'thin', color: '#D9D9D9' } }

guide.getRange('A21:F21').values = [['หมายเหตุ', 'ฟิลด์เพศและสถานะยังไม่มีในโค้ดปัจจุบัน จึงต้องเพิ่มใน Frontend, Edge Function และตาราง Supabase ก่อนเก็บข้อมูลจริง', null, null, null, null]]
guide.getRange('A21:F21').format = { fill: '#EAF2F8', wrapText: true, font: { italic: true } }
guide.getRange('A1:F21').format.font.name = 'Aptos'
guide.getRange('A3:F3').format.rowHeight = 42
guide.getRange('A4:F12').format.rowHeight = 42
guide.getRange('A16:F18').format.rowHeight = 42
const guideWidths = [20, 24, 36, 24, 42, 30]
guideWidths.forEach((width, i) => guide.getRangeByIndexes(0, i, 1, 1).format.columnWidth = width)
guide.freezePanes.freezeRows(3)

workbook.recalculate()
const check = await workbook.inspect({ kind: 'table', sheetId: 'Participant_Data', range: 'A1:Q8', include: 'values,formulas', tableMaxRows: 8, tableMaxCols: 17, maxChars: 10000 })
console.log(check.ndjson)
const preview = await workbook.render({ sheetName: 'Participant_Data', range: 'A1:Q12', scale: 1, format: 'png' })
await fs.mkdir(outputDir, { recursive: true })
await fs.writeFile(`${outputDir}/Bloomscape_participant_data_preview.png`, new Uint8Array(await preview.arrayBuffer()))
const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(outputPath)
console.log(`saved ${outputPath}`)
