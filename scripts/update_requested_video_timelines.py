import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'client' / 'public' / 'healthData.json'
data = json.loads(path.read_text())

def find_keyword(condition_id, keyword_id):
    for condition in data:
        if condition.get('id') == condition_id:
            for keyword in condition.get('keywords', []):
                if keyword.get('id') == keyword_id:
                    return keyword
    raise SystemExit(f'keyword not found: {condition_id}/{keyword_id}')

diabetes = find_keyword('diabetes', 'diabetes-exercise')
diabetes['video']['timeline'] = [
    {'label': '허벅지 앞 스트레칭', 'time': '00:18', 'seconds': 18},
    {'label': '종아리 스트레칭', 'time': '01:02', 'seconds': 62},
    {'label': '스쿼트', 'time': '01:47', 'seconds': 107},
    {'label': '둔근 운동', 'time': '02:39', 'seconds': 159},
    {'label': '종아리 운동', 'time': '03:39', 'seconds': 219},
    {'label': '햄스트링 스트레칭', 'time': '04:28', 'seconds': 268},
    {'label': '운동 마무리', 'time': '05:17', 'seconds': 317},
]

dyslipidemia = find_keyword('dyslipidemia', 'dyslipidemia-diet')
additional = dyslipidemia.setdefault('additionalVideos', [])
additional[:] = [video for video in additional if video.get('youtubeId') != 'X0gn7vBPGr0']
additional.append({
    'title': '고지혈증 환자를 위한 건강한 빵 선택법',
    'channel': '닥터딩요',
    'youtubeId': 'X0gn7vBPGr0',
    'format': 'full',
    'duration': '영상 가이드',
    'summary': '고지혈증 환자가 빵을 고를 때 확인할 조건과 재료, 제품별 선택 기준을 설명합니다.',
    'targetTimePerDay': '식품 선택 시 참고',
    'timeline': [
        {'label': '원리', 'time': '01:34', 'seconds': 94},
        {'label': '좋은 빵 4가지 조건', 'time': '02:40', 'seconds': 160},
        {'label': '포화지방 낮은 빵', 'time': '04:12', 'seconds': 252},
        {'label': '귀리·통밀 논문비교', 'time': '08:15', 'seconds': 495},
        {'label': '고지혈증 빵 티어', 'time': '13:51', 'seconds': 831},
        {'label': '만들 경우 재료 선택법', 'time': '17:41', 'seconds': 1061},
        {'label': '시판 제품 5종 비교', 'time': '18:31', 'seconds': 1111},
        {'label': '햄버거·샌드위치 속 재료 티어', 'time': '26:02', 'seconds': 1562},
        {'label': '세줄요약', 'time': '28:19', 'seconds': 1699},
    ],
})

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('updated diabetes exercise timeline and dyslipidemia bread video timeline')
