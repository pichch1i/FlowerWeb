import json


_last_event_id = None
_cursor = None
_flower_indices = {
    'sunflower': 0,
    'lavender': 1,
    'daisy': 2,
    'striped_carnation': 3,
    'dandelion': 4,
}


def _as_int(value, fallback=0):
    try:
        return int(value)
    except Exception:
        return fallback


def _normalize_event(event):
    if not isinstance(event, dict):
        debug('Flower API skipped a non-object event')
        return None

    event_id = str(event.get('eventId') or '').strip()
    flower_id = str(event.get('flowerId') or '').strip()

    if not event_id or flower_id not in _flower_indices:
        debug('Flower API skipped an invalid event:', event_id, flower_id)
        return None

    normalized = dict(event)
    normalized['eventId'] = event_id
    normalized['flowerId'] = flower_id
    normalized['visualIndex'] = _flower_indices[flower_id]
    normalized['flower'] = str(event.get('flower') or '').strip()
    normalized['flowerNickname'] = str(
        event.get('flowerNickname') or ''
    ).strip()[:15]
    normalized['displayName'] = str(
        event.get('displayName')
        or normalized['flowerNickname']
        or normalized['flower']
    ).strip()
    normalized['hasNickname'] = int(bool(normalized['flowerNickname']))
    return normalized


def _process_event(event):
    global _last_event_id

    event = _normalize_event(event)

    if event is None:
        return False

    event_id = event['eventId']

    if not event_id or event_id == _last_event_id:
        return False

    _last_event_id = event_id

    result_table = op('flower_result')

    if result_table is not None:
        result_table.clear()
        result_table.appendRow(['key', 'value'])

        for key in (
            'eventId',
            'eventType',
            'submissionId',
            'emotion',
            'flowerId',
            'flower',
            'resultTitle',
            'visualIndex',
            'flowerNickname',
            'displayName',
            'hasNickname',
            'nicknameSubmittedAt',
            'submittedAt',
        ):
            result_table.appendRow([key, event.get(key, '')])

    flower_switch = op('flower_switch')

    if flower_switch is not None:
        flower_switch.par.index = event['visualIndex']

    debug(
        'New flower result:',
        event.get('flowerId'),
        event.get('emotion'),
        event.get('flowerNickname', ''),
    )
    return True


def _update_cursor_url(webClientDAT, cursor):
    # Apps Script's `action=events` returns a cursor. Passing it back as `after`
    # lets TouchDesigner receive every new submission instead of only the latest.
    if not cursor:
        return

    for parameter_name in ('url', 'requesturl', 'uri'):
        parameter = getattr(webClientDAT.par, parameter_name, None)

        if parameter is None:
            continue

        current_url = str(parameter.eval())

        if 'action=events' not in current_url:
            return

        base_url = current_url.split('&after=', 1)[0]
        parameter.val = base_url + '&after=' + str(cursor)
        return


def onConnect(webClientDAT):
    return


def onDisconnect(webClientDAT):
    return


def onResponse(webClientDAT, statusCode, headerDict, data):
    global _cursor

    code = statusCode.get('code', 0) if isinstance(statusCode, dict) else statusCode

    if _as_int(code, 0) != 200:
        debug('Flower API HTTP error:', statusCode)
        return

    try:
        payload = json.loads(data)
    except Exception as error:
        debug('Flower API JSON error:', error)
        return

    if not payload.get('ok'):
        debug('Flower API error:', payload.get('error', 'unknown_error'))
        return

    if 'events' in payload:
        events = payload.get('events') or []

        if not isinstance(events, list):
            debug('Flower API error: events must be a list')
            return

        for event in events:
            _process_event(event)

        _cursor = payload.get('cursor', _cursor)
        _update_cursor_url(webClientDAT, _cursor)
        return

    if not payload.get('hasResult'):
        return

    _process_event(payload)

    return
