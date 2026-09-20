import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parents[1] / 'client' / 'public' / 'healthData.json'


def channel_name(youtube_id: str) -> str | None:
    url = (
        'https://www.youtube.com/oembed?url='
        + urllib.parse.quote(f'https://www.youtube.com/watch?v={youtube_id}', safe='')
        + '&format=json'
    )
    try:
        with urllib.request.urlopen(url, timeout=12) as response:
            payload = json.loads(response.read().decode('utf-8'))
        return payload.get('author_name') or None
    except Exception as exc:
        print(f'channel lookup skipped for {youtube_id}: {exc}', file=sys.stderr)
        return None


def sync_video(video: dict) -> bool:
    youtube_id = video.get('youtubeId')
    if not youtube_id:
        return False
    name = channel_name(youtube_id)
    if not name:
        return False
    changed = video.get('channel') != name
    video['channel'] = name
    return changed


data = json.loads(DATA_PATH.read_text())
changed = 0
for condition in data:
    for keyword in condition.get('keywords', []):
        if sync_video(keyword.get('video', {})):
            changed += 1
        for video in keyword.get('additionalVideos', []):
            if sync_video(video):
                changed += 1

if changed:
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print(f'synchronized {changed} YouTube channel name(s)')
