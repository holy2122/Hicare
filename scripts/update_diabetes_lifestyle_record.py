import json
from pathlib import Path

path = Path('/home/ubuntu/health-care-guide/client/public/healthData.json')
data = json.loads(path.read_text())

for condition in data:
    if condition.get('id') != 'diabetes':
        continue
    for keyword in condition.get('keywords', []):
        if keyword.get('id') != 'diabetes-cgm':
            continue
        keyword['tag'] = '생활습관 기록'
        keyword['video'] = {
            'title': '자가혈당 측정·기록 안내',
            'channel': '유튜브 영상',
            'youtubeId': 'NBumehWoWE4',
            'startSeconds': 27,
            'duration': '영상 가이드',
            'summary': '식사와 생활습관에 따른 혈당을 측정하고 기록하는 방법을 안내합니다.',
            'difficulty': '초급',
            'targetTimePerDay': '측정 시 기록',
        }
        keyword['additionalVideos'] = [
            {
                'title': '혈당 기록 참고 영상',
                'channel': '유튜브 영상',
                'youtubeId': '9jGaam5NStQ',
                'duration': '영상 가이드',
                'summary': '혈당 기록과 생활습관 관리를 참고할 수 있는 추가 영상입니다.',
                'difficulty': '초급',
                'targetTimePerDay': '참고 시청',
            }
        ]
        break
    break
else:
    raise SystemExit('diabetes condition not found')

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('updated diabetes lifestyle record and ordered videos')
