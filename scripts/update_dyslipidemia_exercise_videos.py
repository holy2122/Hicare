import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'client' / 'public' / 'healthData.json'
data = json.loads(path.read_text())

full_video = {
    'title': '하루 15분 혈관 지방 태우는 운동',
    'channel': '바른건강',
    'youtubeId': 'zIQ-8ovFq1o',
    'format': 'full',
    'duration': '운동 가이드',
    'summary': '고지혈 관리와 혈액순환을 돕는 하루 15분 운동을 안내합니다.',
    'difficulty': '초급',
    'targetTimePerDay': '하루 15분',
}
short_videos = [
    {
        'title': '고지혈증 잡는 실내 유산소 운동',
        'channel': '에헤라 티비 : KBS LIFE',
        'youtubeId': '1uAmlIqq1DU',
        'format': 'short',
        'duration': 'Shorts',
        'summary': '고지혈증 관리를 위한 간단한 실내 유산소 운동입니다.',
        'difficulty': '초급',
        'targetTimePerDay': '짧게 따라하기',
    },
    {
        'title': '고지혈증 물리치는 실내 전신 운동',
        'channel': '에헤라 티비 : KBS LIFE',
        'youtubeId': 'u_3l3H68R7c',
        'format': 'short',
        'duration': 'Shorts',
        'summary': '집에서 따라 할 수 있는 간단한 전신 근력운동입니다.',
        'difficulty': '초급',
        'targetTimePerDay': '짧게 따라하기',
    },
]

for condition in data:
    if condition.get('id') != 'dyslipidemia':
        continue
    for keyword in condition.get('keywords', []):
        if keyword.get('id') == 'dyslipidemia-exercise':
            keyword['video'] = full_video
            keyword['additionalVideos'] = short_videos
            break
    else:
        raise SystemExit('dyslipidemia exercise keyword not found')
    break
else:
    raise SystemExit('dyslipidemia condition not found')

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('updated dyslipidemia exercise with one full video and two shorts')
