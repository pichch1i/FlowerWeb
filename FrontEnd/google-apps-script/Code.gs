const SHEET_NAME = 'Responses';
const USAGE_LOG_SHEET_NAME = 'Usage Logs';
const DEFAULT_ADMIN_PASSWORD = 'boomscape-admin-2026';

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
];

const ALLOWED_EMOTIONS = [
  'Hope',
  'Anxiety',
  'Serenity',
  'Sadness',
  'Frustration',
];

const ALLOWED_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

const FEEDBACK_HEADERS = [
  'ความคิดเห็นต่อผลลัพธ์',
  'เวลาที่บันทึกความคิดเห็น (Google)',
  'เวลาที่ส่งความคิดเห็น (อุปกรณ์)',
];

const USAGE_LOG_HEADERS = [
  'Log ID',
  'เวลาที่บันทึก (Google)',
  'เวลาที่เกิดเหตุการณ์ (อุปกรณ์)',
  'Session ID',
  'Submission ID',
  'Event Type',
  'Page',
  'Target',
  'Details',
  'Path',
  'Referrer',
  'User Agent',
  'Language',
  'Viewport',
  'Screen',
  'Timezone',
];

function doGet(event) {
  const action = String(
    event && event.parameter ? event.parameter.action || '' : '',
  );

  if (action === 'latest') {
    return getLatestTouchDesignerResult(event);
  }

  if (action === 'admin') {
    return getAdminDashboard(event);
  }

  return jsonResponse({ ok: true, service: 'Flower quiz responses' });
}

function getLatestTouchDesignerResult(event) {
  const properties = PropertiesService.getScriptProperties();
  const expectedKey = properties.getProperty('TOUCHDESIGNER_API_KEY');
  const suppliedKey = String(
    event && event.parameter ? event.parameter.key || '' : '',
  );

  if (!expectedKey || suppliedKey !== expectedKey) {
    return jsonResponse({ ok: false, error: 'unauthorized' });
  }

  const latestJson = properties.getProperty('TOUCHDESIGNER_LATEST_RESULT');

  if (!latestJson) {
    return jsonResponse({ ok: true, hasResult: false });
  }

  return jsonResponse(JSON.parse(latestJson));
}

function getAdminDashboard(event) {
  const params = event && event.parameter ? event.parameter : {};
  const suppliedPassword = String(params.password || '');
  const callback = sanitizeJsonpCallback(params.callback);
  const properties = PropertiesService.getScriptProperties();
  const expectedPassword =
    properties.getProperty('ADMIN_PASSWORD') || DEFAULT_ADMIN_PASSWORD;

  if (suppliedPassword !== expectedPassword) {
    return callback
      ? jsonpResponse(callback, { ok: false, error: 'unauthorized' })
      : jsonResponse({ ok: false, error: 'unauthorized' });
  }

  const limit = Math.min(Math.max(Number(params.limit) || 200, 1), 1000);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const responsesSheet =
    spreadsheet.getSheetByName(SHEET_NAME) ||
    spreadsheet.insertSheet(SHEET_NAME);
  const usageLogSheet =
    spreadsheet.getSheetByName(USAGE_LOG_SHEET_NAME) ||
    spreadsheet.insertSheet(USAGE_LOG_SHEET_NAME);

  ensureHeaders(responsesSheet);
  ensureUsageLogHeaders(usageLogSheet);

  const body = {
    ok: true,
    generatedAt: new Date().toISOString(),
    responses: readSheetRecords(responsesSheet, limit),
    logs: readSheetRecords(usageLogSheet, limit),
  };

  return callback ? jsonpResponse(callback, body) : jsonResponse(body);
}

function setupTouchDesignerApiKey() {
  const key = Utilities.getUuid().replace(/-/g, '') +
    Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty(
    'TOUCHDESIGNER_API_KEY',
    key,
  );
  console.log('TouchDesigner API key: ' + key);
  return key;
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    const requestPayload = parseRequestBody(event);
    lock.waitLock(10000);

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet =
      spreadsheet.getSheetByName(SHEET_NAME) ||
      spreadsheet.insertSheet(SHEET_NAME);

    ensureHeaders(sheet);

    if (String(requestPayload.action || '') === 'log') {
      const usageLog = parseAndValidateUsageLog(requestPayload);
      const usageLogSheet =
        spreadsheet.getSheetByName(USAGE_LOG_SHEET_NAME) ||
        spreadsheet.insertSheet(USAGE_LOG_SHEET_NAME);

      ensureUsageLogHeaders(usageLogSheet);
      appendUsageLog(usageLogSheet, usageLog);
      return jsonResponse({ ok: true, logged: true });
    }

    if (String(requestPayload.action || '') === 'feedback') {
      const feedback = parseAndValidateFeedback(requestPayload);
      const submissionRow = findSubmissionRow(
        sheet,
        feedback.submissionId,
      );

      if (!submissionRow) {
        throw new Error('Submission not found');
      }

      const feedbackColumns = ensureFeedbackColumns(sheet);

      sheet
        .getRange(submissionRow, feedbackColumns[0], 1, 3)
        .setValues([
          [
            protectCell(feedback.feedback, 500),
            new Date(),
            feedback.feedbackSubmittedAt,
          ],
        ]);

      return jsonResponse({ ok: true, feedbackUpdated: true });
    }

    const payload = parseAndValidatePayload(requestPayload);

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
    );

    sheet.appendRow(row);
    saveLatestTouchDesignerResult(payload);
    return jsonResponse({ ok: true, duplicate: false });
  } catch (error) {
    return jsonResponse({ ok: false, error: 'invalid_request' });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function appendUsageLog(sheet, usageLog) {
  sheet.appendRow([
    usageLog.eventId,
    new Date(),
    usageLog.occurredAt,
    usageLog.sessionId,
    usageLog.submissionId,
    usageLog.eventType,
    usageLog.page,
    usageLog.target,
    usageLog.details,
    usageLog.path,
    usageLog.referrer,
    usageLog.userAgent,
    usageLog.language,
    usageLog.viewport,
    usageLog.screen,
    usageLog.timezone,
  ]);
}

function saveLatestTouchDesignerResult(payload) {
  const flowerIds = {
    Hope: 'sunflower',
    Anxiety: 'lavender',
    Serenity: 'daisy',
    Sadness: 'striped_carnation',
    Frustration: 'dandelion',
  };
  const visualIndices = {
    sunflower: 0,
    lavender: 1,
    daisy: 2,
    striped_carnation: 3,
    dandelion: 4,
  };
  const flowerId = flowerIds[payload.result.emotion] || 'sunflower';
  const result = {
    ok: true,
    hasResult: true,
    eventId: payload.submissionId,
    emotion: payload.result.emotion,
    flowerId: flowerId,
    flower: payload.result.flower,
    resultTitle: payload.result.resultTitle,
    visualIndex: visualIndices[flowerId],
    submittedAt: payload.submittedAt.toISOString(),
  };

  PropertiesService.getScriptProperties().setProperty(
    'TOUCHDESIGNER_LATEST_RESULT',
    JSON.stringify(result),
  );
}

function parseRequestBody(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error('Missing request body');
  }

  return JSON.parse(event.postData.contents);
}

function parseAndValidateFeedback(payload) {
  const submissionId = String(payload.submissionId || '');
  const feedback = String(payload.feedback || '').trim();
  const feedbackSubmittedAt = new Date(
    String(payload.feedbackSubmittedAt || ''),
  );

  if (!/^[a-zA-Z0-9-]{10,100}$/.test(submissionId)) {
    throw new Error('Invalid submission ID');
  }

  if (!feedback || feedback.length > 500) {
    throw new Error('Invalid feedback');
  }

  if (Number.isNaN(feedbackSubmittedAt.getTime())) {
    throw new Error('Invalid feedback time');
  }

  return {
    submissionId: submissionId,
    feedback: feedback,
    feedbackSubmittedAt: feedbackSubmittedAt,
  };
}

function parseAndValidateUsageLog(payload) {
  const eventId = String(payload.eventId || '');
  const sessionId = String(payload.sessionId || '');
  const submissionId = String(payload.submissionId || '');
  const eventType = String(payload.eventType || '');
  const page = String(payload.page || '');
  const target = String(payload.target || '');
  const occurredAt = new Date(String(payload.occurredAt || ''));
  const allowedEventTypes = [
    'page_view',
    'button_click',
    'answer_select',
    'form_submit',
  ];

  if (!/^[a-zA-Z0-9-]{10,120}$/.test(eventId)) {
    throw new Error('Invalid log ID');
  }

  if (!/^[a-zA-Z0-9-]{10,120}$/.test(sessionId)) {
    throw new Error('Invalid session ID');
  }

  if (
    submissionId &&
    !/^[a-zA-Z0-9-]{10,120}$/.test(submissionId)
  ) {
    throw new Error('Invalid submission ID');
  }

  if (allowedEventTypes.indexOf(eventType) === -1) {
    throw new Error('Invalid event type');
  }

  if (!page || page.length > 80 || !target || target.length > 120) {
    throw new Error('Invalid log target');
  }

  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error('Invalid log time');
  }

  return {
    eventId: eventId,
    sessionId: sessionId,
    submissionId: submissionId,
    eventType: eventType,
    page: protectCell(page, 80),
    target: protectCell(target, 120),
    occurredAt: occurredAt,
    details: protectCell(JSON.stringify(payload.details || {}), 1000),
    path: protectCell(payload.path, 300),
    referrer: protectCell(payload.referrer, 300),
    userAgent: protectCell(payload.userAgent, 500),
    language: protectCell(payload.language, 40),
    viewport: protectCell(payload.viewport, 40),
    screen: protectCell(payload.screen, 40),
    timezone: protectCell(payload.timezone, 80),
  };
}

function parseAndValidatePayload(payload) {
  const age = Number(payload.player && payload.player.age);
  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  const submissionId = String(payload.submissionId || '');
  const submittedAt = new Date(String(payload.submittedAt || ''));

  if (!/^[a-zA-Z0-9-]{10,100}$/.test(submissionId)) {
    throw new Error('Invalid submission ID');
  }

  if (Number.isNaN(submittedAt.getTime())) {
    throw new Error('Invalid submission time');
  }

  if (!payload.player || !String(payload.player.fullName || '').trim()) {
    throw new Error('Invalid name');
  }

  if (!Number.isInteger(age) || age < 1 || age > 70) {
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
    answers: normalizedAnswers,
    result: {
      emotion: String(payload.result.emotion),
      flower: String(payload.result.flower || ''),
      resultTitle: String(payload.result.resultTitle || ''),
    },
  };
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function hasSubmission(sheet, submissionId) {
  return Boolean(findSubmissionRow(sheet, submissionId));
}

function findSubmissionRow(sheet, submissionId) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return 0;
  }

  const match = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(submissionId)
    .matchEntireCell(true)
    .findNext();

  return match ? match.getRow() : 0;
}

function ensureFeedbackColumns(sheet) {
  const headerWidth = Math.max(sheet.getLastColumn(), HEADERS.length);
  const headers = sheet
    .getRange(1, 1, 1, headerWidth)
    .getDisplayValues()[0];
  const columns = [];

  FEEDBACK_HEADERS.forEach(function (header) {
    let column = headers.indexOf(header) + 1;

    if (!column) {
      column = headers.length + 1;
      sheet.getRange(1, column).setValue(header);
      headers.push(header);
    }

    columns.push(column);
  });

  return columns;
}

function ensureUsageLogHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet
      .getRange(1, 1, 1, USAGE_LOG_HEADERS.length)
      .setValues([USAGE_LOG_HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function readSheetRecords(sheet, limit) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) {
    return [];
  }

  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const rowCount = Math.min(limit, lastRow - 1);
  const startRow = Math.max(2, lastRow - rowCount + 1);
  const values = sheet
    .getRange(startRow, 1, rowCount, lastColumn)
    .getDisplayValues()
    .reverse();

  return values.map(function (row) {
    const record = {};

    headers.forEach(function (header, index) {
      if (header) {
        record[header] = row[index] || '';
      }
    });

    return record;
  });
}

function sanitizeJsonpCallback(callback) {
  const text = String(callback || '');
  return /^[a-zA-Z_$][0-9a-zA-Z_$]*(\.[a-zA-Z_$][0-9a-zA-Z_$]*)*$/.test(text)
    ? text
    : '';
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

function jsonpResponse(callback, body) {
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(body) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
