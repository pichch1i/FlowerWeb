import json


_last_event_id = None
_cursor = None


def _as_int(value, fallback=0):
    try:
        return int(value)
    except Exception:
        return fallback


def _process_event(event):
    global _last_event_id

    event_id = event.get('eventId')

    if not event_id or event_id == _last_event_id:
        return

    _last_event_id = event_id

    result_table = op('flower_result')

    if result_table is not None:
        result_table.clear()
        result_table.appendRow(['key', 'value'])

        for key in (
            'eventId',
            'emotion',
            'flowerId',
            'flower',
            'resultTitle',
            'visualIndex',
            'submittedAt',
        ):
            result_table.appendRow([key, event.get(key, '')])

    flower_switch = op('flower_switch')

    if flower_switch is not None:
        flower_switch.par.index = _as_int(event.get('visualIndex'), 0)

    debug(
        'New flower result:',
        event.get('flowerId'),
        event.get('emotion'),
    )


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

    if int(code) != 200:
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

        for event in events:
            _process_event(event)

        _cursor = payload.get('cursor', _cursor)
        _update_cursor_url(webClientDAT, _cursor)
        return

    if not payload.get('hasResult'):
        return

    _process_event(payload)

    return
