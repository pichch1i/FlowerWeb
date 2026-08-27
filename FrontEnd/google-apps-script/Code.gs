const SHEET_NAME = 'Responses';

const HEADERS = [
  'Submission ID',
  'เวลาที่บันทึก (Google)',
  'เวลาที่ส่ง (อุปกรณ์)',
  'ชื่อ–นามสกุล',
  'อายุ',
  'อาชีพ',
  'Q1 ตัวเลือก',
  'Q1 อารมณ์',
  'Q2 ตัวเลือก',
  'Q2 อารมณ์',
  'Q3 ตัวเลือก',
  'Q3 อารมณ์',
  'Q4 ตัวเลือก',
  'Q4 อารมณ์',
  'Q5 ตัวเลือก',
  'Q5 อารมณ์',
  'Q6 ตัวเลือก',
  'Q6 อารมณ์',
  'Q7 ตัวเลือก',
  'Q7 อารมณ์',
  'ผลอารมณ์',
  'ดอกไม้',
  'ชื่อผลลัพธ์',
  'ยินยอม PDPA',
  'เวลาที่ยินยอม',
  'เวอร์ชันประกาศความเป็นส่วนตัว',
];

const ALLOWED_EMOTIONS = [
  'Hope',
  'Anxiety',
  'Serenity',
  'Sadness',
  'Frustration',
];

const ALLOWED_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

function doGet() {
  return jsonResponse({ ok: true, service: 'Flower quiz responses' });
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    const payload = parseAndValidatePayload(event);
    lock.waitLock(10000);

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet =
      spreadsheet.getSheetByName(SHEET_NAME) ||
      spreadsheet.insertSheet(SHEET_NAME);

    ensureHeaders(sheet);

    if (hasSubmission(sheet, payload.submissionId)) {
      return jsonResponse({ ok: true, duplicate: true });
    }

    const row = [
      payload.submissionId,
      new Date(),
      payload.submittedAt,
      protectCell(payload.player.fullName, 120),
      payload.player.age,
      protectCell(payload.player.occupation, 120),
    ];

    payload.answers.forEach(function (answer) {
      row.push(answer.optionId, answer.emotion);
    });

    row.push(
      payload.result.emotion,
      protectCell(payload.result.flower, 80),
      protectCell(payload.result.resultTitle, 120),
      payload.consent.accepted ? 'ยินยอม' : 'ไม่ยินยอม',
      payload.consent.acceptedAt,
      payload.consent.noticeVersion,
    );

    sheet.appendRow(row);
    return jsonResponse({ ok: true, duplicate: false });
  } catch (error) {
    return jsonResponse({ ok: false, error: 'invalid_request' });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function parseAndValidatePayload(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error('Missing request body');
  }

  const payload = JSON.parse(event.postData.contents);
  const age = Number(payload.player && payload.player.age);
  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  const submissionId = String(payload.submissionId || '');
  const submittedAt = new Date(String(payload.submittedAt || ''));
  const consentAcceptedAt = new Date(
    String(
      payload.consent && payload.consent.acceptedAt
        ? payload.consent.acceptedAt
        : '',
    ),
  );
  const noticeVersion = String(
    payload.consent && payload.consent.noticeVersion
      ? payload.consent.noticeVersion
      : '',
  );

  if (!/^[a-zA-Z0-9-]{10,100}$/.test(submissionId)) {
    throw new Error('Invalid submission ID');
  }

  if (Number.isNaN(submittedAt.getTime())) {
    throw new Error('Invalid submission time');
  }

  if (
    !payload.consent ||
    payload.consent.accepted !== true ||
    Number.isNaN(consentAcceptedAt.getTime()) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(noticeVersion)
  ) {
    throw new Error('Invalid privacy consent');
  }

  if (!payload.player || !String(payload.player.fullName || '').trim()) {
    throw new Error('Invalid name');
  }

  if (!Number.isInteger(age) || age < 13 || age > 120) {
    throw new Error('Invalid age');
  }

  if (!String(payload.player.occupation || '').trim()) {
    throw new Error('Invalid occupation');
  }

  if (answers.length !== 7) {
    throw new Error('Seven answers are required');
  }

  const normalizedAnswers = answers
    .map(function (answer) {
      return {
        question: Number(answer.question),
        optionId: String(answer.optionId || ''),
        emotion: String(answer.emotion || ''),
      };
    })
    .sort(function (left, right) {
      return left.question - right.question;
    });

  normalizedAnswers.forEach(function (answer, index) {
    if (
      answer.question !== index + 1 ||
      ALLOWED_OPTIONS.indexOf(answer.optionId) === -1 ||
      ALLOWED_EMOTIONS.indexOf(answer.emotion) === -1
    ) {
      throw new Error('Invalid answer');
    }
  });

  if (
    !payload.result ||
    ALLOWED_EMOTIONS.indexOf(String(payload.result.emotion || '')) === -1
  ) {
    throw new Error('Invalid result');
  }

  return {
    submissionId: submissionId,
    submittedAt: submittedAt,
    player: {
      fullName: String(payload.player.fullName),
      age: age,
      occupation: String(payload.player.occupation),
    },
    consent: {
      accepted: true,
      acceptedAt: consentAcceptedAt,
      noticeVersion: noticeVersion,
    },
    answers: normalizedAnswers,
    result: {
      emotion: String(payload.result.emotion),
      flower: String(payload.result.flower || ''),
      resultTitle: String(payload.result.resultTitle || ''),
    },
  };
}

function ensureHeaders(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
}

function hasSubmission(sheet, submissionId) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return false;
  }

  return Boolean(
    sheet
      .getRange(2, 1, lastRow - 1, 1)
      .createTextFinder(submissionId)
      .matchEntireCell(true)
      .findNext(),
  );
}

function protectCell(value, maxLength) {
  const text = String(value || '').trim().slice(0, maxLength);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
