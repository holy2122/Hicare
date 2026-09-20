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
        videos = keyword.get('additionalVideos') or []
        if not videos:
            raise SystemExit('additional video not found')
        video = videos[0]
        video.update({
            'title': '당뇨 환자 아침 식사법 총정리',
            'summary': '아침 식사의 구성·시간·양과 점심 혈당을 돕는 두 번째 식사 현상을 설명합니다.',
            'keyPoints': [
                '아침에 단백질과 복합 탄수화물을 함께 챙겨 드세요.',
                '아침을 든든하게 먹는 만큼 점심·저녁 양을 줄여 하루 총열량을 유지하세요.',
                '공복 운동은 피하고 아침 식사 30분 후에 운동하세요.',
            ],
        })
        break
    break
else:
    raise SystemExit('diabetes condition not found')

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('updated breakfast video title, summary, and key points')
