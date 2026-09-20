import json
from pathlib import Path

path = Path('/home/ubuntu/health-care-guide/client/public/healthData.json')
data = json.loads(path.read_text())

for condition in data:
    if condition.get('id') != 'dyslipidemia':
        continue
    for keyword in condition.get('keywords', []):
        if keyword.get('id') != 'dyslipidemia-diet':
            continue
        keyword['title'] = '포화지방 줄여 LDL 낮추기'
        keyword['subtitle'] = '포화지방을 줄여 LDL 콜레스테롤을 관리합니다.'
        keyword['shortActionSummary'] = '포화지방 하루 15g 이하로 줄이세요.'
        keyword['actionSteps'] = [
            {
                'title': '1. 빵·과자·디저트 줄이기',
                'desc': '앙버터·크루아상·과자·아이스크림·믹스커피처럼 버터·팜유·코코넛유가 들어간 간식을 먼저 줄입니다.',
                'metric': '숨은 포화지방 확인',
            },
            {
                'title': '2. 살코기 부위로 바꾸기',
                'desc': '삼겹살·차돌박이 대신 안심·등심·뒷다리살과 껍질을 제거한 닭고기를 선택합니다. 조리법보다 부위가 중요합니다.',
                'metric': '부위 선택 우선',
            },
            {
                'title': '3. 불포화지방으로 대체하기',
                'desc': '기존 포화지방 식품을 생선·두부·견과류로 바꾸고, 생선은 주 2회 이상 섭취하는 식으로 식단을 구성합니다.',
                'metric': '더하기보다 바꾸기',
            },
        ]
        keyword['video'] = {
            'title': '음식으로 콜레스테롤 떨어뜨리는 방법 1부',
            'channel': '유튜브 영상',
            'youtubeId': 'c7svGGafLoU',
            'duration': '영상 가이드',
            'summary': 'LDL을 높이는 포화지방의 원인과 빵·과자·기름진 육류를 줄이는 방법을 설명합니다.',
            'difficulty': '초급',
            'targetTimePerDay': '식단 선택 시 적용',
        }
        keyword['additionalVideos'] = [
            {
                'title': '음식으로 콜레스테롤 떨어뜨리는 방법 2부',
                'channel': '유튜브 영상',
                'youtubeId': 'LbFrj12cQqY',
                'duration': '영상 가이드',
                'summary': '생선·두부로 포화지방을 대체하고, 삶고 찌는 조리와 가공식품 줄이기로 콜레스테롤 관리를 실천하는 방법을 소개합니다.',
                'difficulty': '초급',
                'targetTimePerDay': '식단 선택 시 적용',
                'keyPoints': [
                    '기름진 고기 대신 생선과 두부를 선택해 포화지방을 대체하세요.',
                    '빵·과자·아이스크림·가공육과 믹스커피 같은 트랜스지방 식품을 줄이세요.',
                    '달걀 노른자와 크레마 커피 섭취를 조절하고 필터 커피를 활용하세요.',
                ],
            }
        ]
        break
    break
else:
    raise SystemExit('dyslipidemia condition not found')

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('updated dyslipidemia saturated-fat video pair')
