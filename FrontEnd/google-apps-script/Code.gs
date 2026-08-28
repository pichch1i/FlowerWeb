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

const TOUCHDESIGNER_API_KEY_PROPERTY = 'TOUCHDESIGNER_API_KEY';
const TOUCHDESIGNER_LATEST_RESULT_PROPERTY =
  'TOUCHDESIGNER_LATEST_RESULT';

const TOUCHDESIGNER_RESULTS = {
  Hope: {
    flowerId: 'sunflower',
    flower: 'ดอกทานตะวัน',
    resultTitle: 'ดอกไม้แห่งแสงวันใหม่',
    visualIndex: 0,
  },
  Anxiety: {
    flowerId: 'lavender',
    flower: 'ลาเวนเดอร์',
    resultTitle: 'ดอกไม้แห่งการปลอบประโลม',
    visualIndex: 1,
  },
  Serenity: {
    flowerId: 'daisy',
    flower: 'ดอกเดซี',
    resultTitle: 'ดอกไม้แห่งลมหายใจ',
    visualIndex: 2,
  },
  Sadness: {
    flowerId: 'striped_carnation',
    flower: 'คาร์เนชั่นลายริ้ว',
    resultTitle: 'ดอกไม้แห่งความรู้สึกลึกซึ้ง',
    visualIndex: 3,
  },
  Frustration: {
    flowerId: 'dandelion',
    flower: 'แดนดิไลออน',
    resultTitle: 'ดอกไม้แห่งแรงผลัก',
    visualIndex: 4,
  },
};

function doGet(event) {
  const action = String(
    event && event.parameter && event.parameter.action
      ? event.parameter.action
      : '',
  );

  if (action === 'latest') {
    return getLatestTouchDesignerResult(event);
  }

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
    publishTouchDesignerResult(payload);
    return jsonResponse({ ok: true, duplicate: false });
  } catch (error) {
    return jsonResponse({ ok: false, error: 'invalid_request' });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function setupTouchDesignerApiKey() {
  const apiKey = (Utilities.getUuid() + Utilities.getUuid()).replace(
    /-/g,
    '',
  );

  PropertiesService.getScriptProperties().setProperty(
    TOUCHDESIGNER_API_KEY_PROPERTY,
    apiKey,
  );

  console.log('TouchDesigner API key: ' + apiKey);
  return apiKey;
}

function publishTouchDesignerResult(payload) {
  const visual = TOUCHDESIGNER_RESULTS[payload.result.emotion];

  if (!visual) {
    return;
  }

  const publicResult = {
    eventId: Utilities.getUuid(),
    submittedAt: payload.submittedAt.toISOString(),
    publishedAt: new Date().toISOString(),
    emotion: payload.result.emotion,
    flowerId: visual.flowerId,
    flower: visual.flower,
    resultTitle: visual.resultTitle,
    visualIndex: visual.visualIndex,
  };

  PropertiesService.getScriptProperties().setProperty(
    TOUCHDESIGNER_LATEST_RESULT_PROPERTY,
    JSON.stringify(publicResult),
  );
}

function getLatestTouchDesignerResult(event) {
  const properties = PropertiesService.getScriptProperties();
  const configuredApiKey = String(
    properties.getProperty(TOUCHDESIGNER_API_KEY_PROPERTY) || '',
  );
  const requestedApiKey = String(
    event && event.parameter && event.parameter.key
      ? event.parameter.key
      : '',
  );

  if (!configuredApiKey) {
    return jsonResponse({
      ok: false,
      error: 'touchdesigner_not_configured',
    });
  }

  if (!requestedApiKey || requestedApiKey !== configuredApiKey) {
    return jsonResponse({ ok: false, error: 'unauthorized' });
  }

  const latestResult = String(
    properties.getProperty(TOUCHDESIGNER_LATEST_RESULT_PROPERTY) || '',
  );

  if (!latestResult) {
    return jsonResponse({
      ok: true,
      hasResult: false,
      fetchedAt: new Date().toISOString(),
    });
  }

  try {
    const result = JSON.parse(latestResult);

    return jsonResponse({
      ok: true,
      hasResult: true,
      eventId: result.eventId,
      submittedAt: result.submittedAt,
      publishedAt: result.publishedAt,
      fetchedAt: new Date().toISOString(),
      emotion: result.emotion,
      flowerId: result.flowerId,
      flower: result.flower,
      resultTitle: result.resultTitle,
      visualIndex: result.visualIndex,
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: 'invalid_latest_result' });
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

  const detectedEmotion = detectDominantEmotion(normalizedAnswers);

  if (
    !payload.result ||
    String(payload.result.emotion || '') !== detectedEmotion
  ) {
    throw new Error('Invalid result');
  }

  const canonicalResult = TOUCHDESIGNER_RESULTS[detectedEmotion];

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
      emotion: detectedEmotion,
      flower: canonicalResult.flower,
      resultTitle: canonicalResult.resultTitle,
    },
  };
}

function detectDominantEmotion(answers) {
  const scores = {};

  ALLOWED_EMOTIONS.forEach(function (emotion) {
    scores[emotion] = 0;
  });

  answers.forEach(function (answer) {
    scores[answer.emotion] += 1;
  });

  const highestScore = Math.max.apply(
    null,
    ALLOWED_EMOTIONS.map(function (emotion) {
      return scores[emotion];
    }),
  );
  const highestEmotions = ALLOWED_EMOTIONS.filter(function (emotion) {
    return scores[emotion] === highestScore;
  });

  if (highestEmotions.length === 1) {
    return highestEmotions[0];
  }

  const q7Emotion = answers[6].emotion;

  if (highestEmotions.indexOf(q7Emotion) !== -1) {
    return q7Emotion;
  }

  return highestEmotions[0];
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
