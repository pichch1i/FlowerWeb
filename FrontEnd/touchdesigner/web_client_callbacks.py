import json


_last_event_id = None


def onConnect(webClientDAT):
    return


def onDisconnect(webClientDAT):
    return


def onResponse(webClientDAT, statusCode, headerDict, data):
    global _last_event_id

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

    if not payload.get('hasResult'):
        return

    event_id = payload.get('eventId')

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
            result_table.appendRow([key, payload.get(key, '')])

    flower_switch = op('flower_switch')

    if flower_switch is not None:
        flower_switch.par.index = int(payload.get('visualIndex', 0))

    debug(
        'New flower result:',
        payload.get('flowerId'),
        payload.get('emotion'),
    )

    return
