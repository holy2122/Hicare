import json
from pathlib import Path

path = Path('/home/ubuntu/health-care-guide/client/public/healthData.json')
data = json.loads(path.read_text())

for condition in data:
    if condition.get('id') != 'diabetes':
        continue
    for keyword in condition.get('keywords', []):
        if keyword.get('id') != 'diabetes-diet':
            continue
        keyword['video']['channel'] = '닥터딩요'
        for video in keyword.get('additionalVideos', []):
            if video.get('youtubeId') == 'FihLathwM3Y':
                video['channel'] = '닥터딩요'
        break
    break
else:
    raise SystemExit('diabetes condition not found')

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('updated diabetes video channels')
