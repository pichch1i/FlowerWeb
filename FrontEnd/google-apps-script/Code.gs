function doGet(event) {
  var action = String(event && event.parameter ? event.parameter.action || '' : '');

  if (action === 'latest') {
    return FW_getLatestTouchDesignerResult_(event);
  }

  if (action === 'events') {
    return FW_getTouchDesignerEvents_(event);
  }

  if (action === 'admin') {
    return FW_getAdminDashboard_(event);
  }

  return FW_jsonResponse_({ ok: true, service: 'Flower quiz responses' });
}

function doPost(event) {
  var lock = LockService.getScriptLock();

  try {
    var payload = FW_parseRequestBody_(event);
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var responseSheet;

    if (String(payload.action || '') === 'log') {
      var logSheet = FW_getOrCreateSheet_(spreadsheet, FW_usageLogSheetName_());
      FW_ensureHeaders_(logSheet, FW_usageLogHeaders_());
      FW_appendUsageLog_(logSheet, FW_parseAndValidateUsageLog_(payload));
      return FW_jsonResponse_({ ok: true, logged: true });
    }

    // Keep analytics traffic out of the response-writing queue. Final quiz,
    // feedback, and nickname writes still use one lock so their rows stay
    // consistent, while the user-facing submit is no longer delayed by logs.
    lock.waitLock(10000);

    responseSheet = FW_getOrCreateSheet_(spreadsheet, FW_responseSheetName_());
    FW_ensureHeaders_(responseSheet, FW_responseHeaders_());

    if (String(payload.action || '') === 'feedback') {
      return FW_saveFeedback_(responseSheet, payload);
    }

    if (String(payload.action || '') === 'nickname') {
      return FW_saveFlowerNickname_(spreadsheet, responseSheet, payload);
    }

    return FW_saveQuizResponse_(spreadsheet, responseSheet, payload);
  } catch (error) {
    return FW_jsonResponse_({
      ok: false,
      error: 'invalid_request',
      message: String(error && error.message ? error.message : error),
    });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function setupTouchDesignerApiKey() {
  var key =
    Utilities.getUuid().replace(/-/g, '') +
    Utilities.getUuid().replace(/-/g, '');

  PropertiesService.getScriptProperties().setProperty(
    'TOUCHDESIGNER_API_KEY',
    key,
  );
  console.log('TouchDesigner API key: ' + key);
  return key;
}

function setupBoomscapeAdminPassword() {
  var password = 'boomscape-admin-2026';
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', password);
  console.log('Admin password: ' + password);
  return password;
}

function FW_saveFeedback_(sheet, payload) {
  var feedback = FW_parseAndValidateFeedback_(payload);
  var submissionRow = FW_findSubmissionRow_(sheet, feedback.submissionId);
  var feedbackColumns;

  if (!submissionRow) {
    throw new Error('Submission not found');
  }

  feedbackColumns = FW_ensureFeedbackColumns_(sheet);
  sheet
    .getRange(submissionRow, feedbackColumns[0], 1, 3)
    .setValues([
      [
        FW_protectCell_(feedback.feedback, 500),
        new Date(),
        feedback.feedbackSubmittedAt,
      ],
    ]);

  return FW_jsonResponse_({ ok: true, feedbackUpdated: true });
}

function FW_saveFlowerNickname_(spreadsheet, sheet, payload) {
  var nickname = FW_parseAndValidateFlowerNickname_(payload);
  var submissionRow = FW_findSubmissionRow_(sheet, nickname.submissionId);
  var nicknameColumns = FW_ensureNicknameColumns_(sheet);
  var placeholderCreated = false;

  // A nickname request can reach Apps Script before the final quiz request.
  // Preserve it immediately, then let FW_saveQuizResponse_ fill the same row.
  if (!submissionRow) {
    sheet.appendRow([nickname.submissionId]);
    submissionRow = sheet.getLastRow();
    placeholderCreated = true;
  }

  sheet
    .getRange(submissionRow, nicknameColumns[0], 1, 3)
    .setValues([
      [
        FW_protectCell_(nickname.flowerNickname, 30),
        new Date(),
        nickname.nicknameSubmittedAt,
      ],
    ]);

  if (FW_responseRowHasResult_(sheet, submissionRow)) {
    FW_appendTouchDesignerEvent_(
      spreadsheet,
      sheet,
      submissionRow,
      'nickname_updated',
    );
  }

  SpreadsheetApp.flush();
  return FW_jsonResponse_({
    ok: true,
    nicknameUpdated: true,
    placeholderCreated: placeholderCreated,
  });
}

function FW_saveQuizResponse_(spreadsheet, sheet, payload) {
  var quiz = FW_parseAndValidateQuizResponse_(payload);
  var existingRow = FW_findSubmissionRow_(sheet, quiz.submissionId);
  var recoveredNicknameRow = Boolean(existingRow);
  var row;

  if (existingRow && sheet.getRange(existingRow, 2).getValue()) {
    return FW_jsonResponse_({ ok: true, duplicate: true });
  }

  row = [
    quiz.submissionId,
    new Date(),
    quiz.submittedAt,
    FW_protectCell_(quiz.player.fullName, 120),
    quiz.player.age,
    FW_protectCell_(quiz.player.occupation, 120),
  ];

  quiz.answers.forEach(function (answer) {
    row.push(answer.optionId, answer.emotion);
  });

  row.push(
    quiz.result.emotion,
    FW_protectCell_(quiz.result.flower, 80),
    FW_protectCell_(quiz.result.resultTitle, 120),
  );

  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
    existingRow = sheet.getLastRow();
  }

  FW_appendTouchDesignerEvent_(spreadsheet, sheet, existingRow, 'result');
  SpreadsheetApp.flush();
  return FW_jsonResponse_({
    ok: true,
    duplicate: false,
    recoveredNicknameRow: recoveredNicknameRow,
  });
}

function FW_getLatestTouchDesignerResult_(event) {
  var properties = PropertiesService.getScriptProperties();
  var expectedKey = properties.getProperty('TOUCHDESIGNER_API_KEY');
  var suppliedKey = String(event && event.parameter ? event.parameter.key || '' : '');
  var latestJson;

  if (!expectedKey || suppliedKey !== expectedKey) {
    return FW_jsonResponse_({ ok: false, error: 'unauthorized' });
  }

  latestJson = properties.getProperty('TOUCHDESIGNER_LATEST_RESULT');

  if (!latestJson) {
    return FW_jsonResponse_({ ok: true, hasResult: false });
  }

  return FW_jsonResponse_(JSON.parse(latestJson));
}

// Cursor-based event feed for TouchDesigner. Result and nickname updates are
// appended to a dedicated sheet so a nickname added after a result is still a
// new event and cannot be skipped by a Responses row cursor.
function FW_getTouchDesignerEvents_(event) {
  var properties = PropertiesService.getScriptProperties();
  var expectedKey = properties.getProperty('TOUCHDESIGNER_API_KEY');
  var suppliedKey = String(event && event.parameter ? event.parameter.key || '' : '');
  var params = event && event.parameter ? event.parameter : {};
  var sheet;
  var lastRow;
  var suppliedCursor;
  var bootstrap;
  var after;
  var count;
  var events = [];

  if (!expectedKey || suppliedKey !== expectedKey) {
    return FW_jsonResponse_({ ok: false, error: 'unauthorized' });
  }

  sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    FW_touchDesignerEventSheetName_(),
  );
  lastRow = sheet ? Math.max(1, sheet.getLastRow()) : 1;
  suppliedCursor = params.after;
  bootstrap = suppliedCursor === undefined || suppliedCursor === '';
  after = bootstrap ? Math.max(1, lastRow - 1) : Number(suppliedCursor);

  if (!Number.isInteger(after) || after < 1) {
    return FW_jsonResponse_({ ok: false, error: 'invalid_cursor' });
  }

  // Existing TouchDesigner projects may still hold a Responses row cursor.
  // Reset it safely to the event queue on the first request after this upgrade.
  if (after > lastRow) {
    after = Math.max(1, lastRow - 1);
  }

  count = Math.min(50, lastRow - after);

  if (sheet && count > 0) {
    var rows = sheet
      .getRange(after + 1, 1, count, FW_touchDesignerEventHeaders_().length)
      .getDisplayValues();

    for (var i = 0; i < count; i += 1) {
      events.push({
        eventId: String(rows[i][0] || ''),
        eventType: String(rows[i][1] || ''),
        submissionId: String(rows[i][2] || ''),
        emotion: String(rows[i][5] || ''),
        flowerId: String(rows[i][6] || ''),
        flower: String(rows[i][7] || ''),
        resultTitle: String(rows[i][8] || ''),
        visualIndex: Number(rows[i][9] || 0),
        flowerNickname: String(rows[i][10] || ''),
        nicknameSubmittedAt: String(rows[i][11] || ''),
        submittedAt: String(rows[i][4] || ''),
      });
    }
  }

  return FW_jsonResponse_({
    ok: true,
    events: events,
    cursor: after + count,
    hasMore: after + count < lastRow,
  });
}

function FW_touchDesignerFlowerMap_() {
  return {
    Hope: { flowerId: 'sunflower', visualIndex: 0 },
    Anxiety: { flowerId: 'lavender', visualIndex: 1 },
    Serenity: { flowerId: 'daisy', visualIndex: 2 },
    Sadness: { flowerId: 'striped_carnation', visualIndex: 3 },
    Frustration: { flowerId: 'dandelion', visualIndex: 4 },
  };
}

function FW_getAdminDashboard_(event) {
  var params = event && event.parameter ? event.parameter : {};
  var callback = FW_sanitizeJsonpCallback_(params.callback);
  var suppliedPassword = String(params.password || '');
  var expectedPassword =
    PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') ||
    'boomscape-admin-2026';
  var spreadsheet;
  var responsesSheet;
  var logsSheet;
  var limit;
  var body;

  if (suppliedPassword !== expectedPassword) {
    body = { ok: false, error: 'unauthorized' };
    return callback ? FW_jsonpResponse_(callback, body) : FW_jsonResponse_(body);
  }

  spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  responsesSheet = FW_getOrCreateSheet_(spreadsheet, FW_responseSheetName_());
  logsSheet = FW_getOrCreateSheet_(spreadsheet, FW_usageLogSheetName_());
  limit = Math.min(Math.max(Number(params.limit) || 200, 1), 1000);

  FW_ensureHeaders_(responsesSheet, FW_responseHeaders_());
  FW_ensureHeaders_(logsSheet, FW_usageLogHeaders_());

  body = {
    ok: true,
    generatedAt: new Date().toISOString(),
    responses: FW_readSheetRecords_(responsesSheet, limit),
    logs: FW_readSheetRecords_(logsSheet, limit),
  };

  return callback ? FW_jsonpResponse_(callback, body) : FW_jsonResponse_(body);
}

function FW_appendTouchDesignerEvent_(spreadsheet, responseSheet, responseRow, eventType) {
  var eventSheet = FW_getOrCreateSheet_(
    spreadsheet,
    FW_touchDesignerEventSheetName_(),
  );
  var responseHeaders = responseSheet
    .getRange(1, 1, 1, responseSheet.getLastColumn())
    .getDisplayValues()[0];
  var responseValues = responseSheet
    .getRange(responseRow, 1, 1, responseHeaders.length)
    .getDisplayValues()[0];
  var emotion = FW_responseValue_(responseHeaders, responseValues, 'ผลอารมณ์');
  var flowerMap = FW_touchDesignerFlowerMap_();
  var flower = flowerMap[emotion];
  var submissionId;
  var body;

  if (!flower) {
    return;
  }

  submissionId = FW_responseValue_(responseHeaders, responseValues, 'Submission ID');
  body = {
    ok: true,
    hasResult: true,
    eventId: submissionId + ':' + eventType + ':' + Utilities.getUuid(),
    eventType: eventType,
    submissionId: submissionId,
    emotion: emotion,
    flowerId: flower.flowerId,
    flower: FW_responseValue_(responseHeaders, responseValues, 'ดอกไม้'),
    resultTitle: FW_responseValue_(responseHeaders, responseValues, 'ชื่อผลลัพธ์'),
    visualIndex: flower.visualIndex,
    flowerNickname: FW_responseValue_(
      responseHeaders,
      responseValues,
      'ชื่อเล่นของดอกไม้',
    ),
    nicknameSubmittedAt: FW_responseValue_(
      responseHeaders,
      responseValues,
      'เวลาที่ส่งชื่อเล่น (อุปกรณ์)',
    ),
    submittedAt: FW_responseValue_(
      responseHeaders,
      responseValues,
      'เวลาที่ส่ง (อุปกรณ์)',
    ),
  };

  FW_ensureHeaders_(eventSheet, FW_touchDesignerEventHeaders_());
  eventSheet.appendRow([
    body.eventId,
    body.eventType,
    body.submissionId,
    new Date(),
    body.submittedAt,
    body.emotion,
    body.flowerId,
    body.flower,
    body.resultTitle,
    body.visualIndex,
    body.flowerNickname,
    body.nicknameSubmittedAt,
  ]);

  PropertiesService.getScriptProperties().setProperty(
    'TOUCHDESIGNER_LATEST_RESULT',
    JSON.stringify(body),
  );
}

function FW_responseRowHasResult_(sheet, row) {
  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];
  var emotionColumn = headers.indexOf('ผลอารมณ์') + 1;

  return Boolean(emotionColumn && sheet.getRange(row, emotionColumn).getValue());
}

function FW_responseValue_(headers, values, header) {
  var index = headers.indexOf(header);
  return index === -1 ? '' : String(values[index] || '');
}

function FW_appendUsageLog_(sheet, log) {
  sheet.appendRow([
    log.eventId,
    new Date(),
    log.occurredAt,
    log.sessionId,
    log.submissionId,
    log.eventType,
    log.page,
    log.target,
    log.details,
    log.path,
    log.referrer,
    log.userAgent,
    log.language,
    log.viewport,
    log.screen,
    log.timezone,
  ]);
}

function FW_parseRequestBody_(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error('Missing request body');
  }

  return JSON.parse(event.postData.contents);
}

function FW_parseAndValidateFeedback_(payload) {
  var submissionId = String(payload.submissionId || '');
  var feedback = String(payload.feedback || '').trim();
  var feedbackSubmittedAt = new Date(String(payload.feedbackSubmittedAt || ''));

  if (!/^[a-zA-Z0-9-]{10,120}$/.test(submissionId)) {
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

function FW_parseAndValidateFlowerNickname_(payload) {
  var submissionId = String(payload.submissionId || '');
  var flowerNickname = String(payload.flowerNickname || '').trim();
  var nicknameSubmittedAt = new Date(String(payload.nicknameSubmittedAt || ''));

  if (!/^[a-zA-Z0-9-]{10,120}$/.test(submissionId)) {
    throw new Error('Invalid submission ID');
  }

  if (!flowerNickname || flowerNickname.length > 30) {
    throw new Error('Invalid flower nickname');
  }

  if (Number.isNaN(nicknameSubmittedAt.getTime())) {
    throw new Error('Invalid nickname time');
  }

  return {
    submissionId: submissionId,
    flowerNickname: flowerNickname,
    nicknameSubmittedAt: nicknameSubmittedAt,
  };
}

function FW_parseAndValidateUsageLog_(payload) {
  var eventId = String(payload.eventId || '');
  var sessionId = String(payload.sessionId || '');
  var submissionId = String(payload.submissionId || '');
  var eventType = String(payload.eventType || '');
  var page = String(payload.page || '');
  var target = String(payload.target || '');
  var occurredAt = new Date(String(payload.occurredAt || ''));
  var allowedEventTypes = [
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

  if (submissionId && !/^[a-zA-Z0-9-]{10,120}$/.test(submissionId)) {
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
    page: FW_protectCell_(page, 80),
    target: FW_protectCell_(target, 120),
    occurredAt: occurredAt,
    details: FW_protectCell_(JSON.stringify(payload.details || {}), 1000),
    path: FW_protectCell_(payload.path, 300),
    referrer: FW_protectCell_(payload.referrer, 300),
    userAgent: FW_protectCell_(payload.userAgent, 500),
    language: FW_protectCell_(payload.language, 40),
    viewport: FW_protectCell_(payload.viewport, 40),
    screen: FW_protectCell_(payload.screen, 40),
    timezone: FW_protectCell_(payload.timezone, 80),
  };
}

function FW_parseAndValidateQuizResponse_(payload) {
  var age = Number(payload.player && payload.player.age);
  var answers = Array.isArray(payload.answers) ? payload.answers : [];
  var submissionId = String(payload.submissionId || '');
  var submittedAt = new Date(String(payload.submittedAt || ''));
  var allowedOptions = FW_allowedOptions_();
  var allowedEmotions = FW_allowedEmotions_();
  var normalizedAnswers;

  if (!/^[a-zA-Z0-9-]{10,120}$/.test(submissionId)) {
    throw new Error('Invalid submission ID');
  }

  if (Number.isNaN(submittedAt.getTime())) {
    throw new Error('Invalid submission time');
  }

  if (!payload.player || !String(payload.player.fullName || '').trim()) {
    throw new Error('Invalid name');
  }

  if (!Number.isInteger(age) || age < 1 || age > 120) {
    throw new Error('Invalid age');
  }

  if (!String(payload.player.occupation || '').trim()) {
    throw new Error('Invalid occupation');
  }

  if (answers.length !== 7) {
    throw new Error('Seven answers are required');
  }

  normalizedAnswers = answers
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
      allowedOptions.indexOf(answer.optionId) === -1 ||
      allowedEmotions.indexOf(answer.emotion) === -1
    ) {
      throw new Error('Invalid answer');
    }
  });

  if (
    !payload.result ||
    allowedEmotions.indexOf(String(payload.result.emotion || '')) === -1
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

function FW_getOrCreateSheet_(spreadsheet, sheetName) {
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function FW_ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function FW_hasSubmission_(sheet, submissionId) {
  return Boolean(FW_findSubmissionRow_(sheet, submissionId));
}

function FW_findSubmissionRow_(sheet, submissionId) {
  var lastRow = sheet.getLastRow();
  var match;

  if (lastRow < 2) {
    return 0;
  }

  match = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(submissionId)
    .matchEntireCell(true)
    .findNext();

  return match ? match.getRow() : 0;
}

function FW_ensureFeedbackColumns_(sheet) {
  var headers = sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), FW_responseHeaders_().length))
    .getDisplayValues()[0];
  var columns = [];

  FW_feedbackHeaders_().forEach(function (header) {
    var column = headers.indexOf(header) + 1;

    if (!column) {
      column = headers.length + 1;
      sheet.getRange(1, column).setValue(header);
      headers.push(header);
    }

    columns.push(column);
  });

  return columns;
}

function FW_ensureNicknameColumns_(sheet) {
  var headers = sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), FW_responseHeaders_().length))
    .getDisplayValues()[0];
  var columns = [];

  FW_nicknameHeaders_().forEach(function (header) {
    var column = headers.indexOf(header) + 1;

    if (!column) {
      column = headers.length + 1;
      sheet.getRange(1, column).setValue(header);
      headers.push(header);
    }

    columns.push(column);
  });

  return columns;
}

function FW_readSheetRecords_(sheet, limit) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  var headers;
  var rowCount;
  var startRow;
  var values;

  if (lastRow < 2 || lastColumn < 1) {
    return [];
  }

  headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  rowCount = Math.min(limit, lastRow - 1);
  startRow = Math.max(2, lastRow - rowCount + 1);
  values = sheet
    .getRange(startRow, 1, rowCount, lastColumn)
    .getDisplayValues()
    .reverse();

  return values.map(function (row) {
    var record = {};

    headers.forEach(function (header, index) {
      if (header) {
        record[header] = row[index] || '';
      }
    });

    return record;
  });
}

function FW_responseSheetName_() {
  return 'Responses';
}

function FW_usageLogSheetName_() {
  return 'Usage Logs';
}

function FW_touchDesignerEventSheetName_() {
  return 'TouchDesigner Events';
}

function FW_responseHeaders_() {
  return [
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
}

function FW_feedbackHeaders_() {
  return [
    'ความคิดเห็นต่อผลลัพธ์',
    'เวลาที่บันทึกความคิดเห็น (Google)',
    'เวลาที่ส่งความคิดเห็น (อุปกรณ์)',
  ];
}

function FW_nicknameHeaders_() {
  return [
    'ชื่อเล่นของดอกไม้',
    'เวลาที่บันทึกชื่อเล่น (Google)',
    'เวลาที่ส่งชื่อเล่น (อุปกรณ์)',
  ];
}

function FW_touchDesignerEventHeaders_() {
  return [
    'Event ID',
    'Event Type',
    'Submission ID',
    'เวลาที่สร้าง Event (Google)',
    'เวลาที่ส่งผลลัพธ์ (อุปกรณ์)',
    'Emotional State',
    'Flower ID',
    'ดอกไม้',
    'ชื่อผลลัพธ์',
    'Visual Index',
    'ชื่อเล่นของดอกไม้',
    'เวลาที่ส่งชื่อเล่น (อุปกรณ์)',
  ];
}

function FW_usageLogHeaders_() {
  return [
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
}

function FW_allowedEmotions_() {
  return ['Hope', 'Anxiety', 'Serenity', 'Sadness', 'Frustration'];
}

function FW_allowedOptions_() {
  return ['A', 'B', 'C', 'D', 'E'];
}

function FW_sanitizeJsonpCallback_(callback) {
  var text = String(callback || '');
  return /^[a-zA-Z_$][0-9a-zA-Z_$]*(\.[a-zA-Z_$][0-9a-zA-Z_$]*)*$/.test(text)
    ? text
    : '';
}

function FW_protectCell_(value, maxLength) {
  var text = String(value || '').trim().slice(0, maxLength);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function FW_jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function FW_jsonpResponse_(callback, body) {
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(body) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
