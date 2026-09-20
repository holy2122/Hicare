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
        keyword['title'] = '거꾸로 식사법'
        keyword['subtitle'] = '채소와 단백질을 먼저 먹어 식후 혈당 상승을 늦춥니다.'
        keyword['shortActionSummary'] = '채소·단백질 먼저, 밥은 15분 뒤에 절반만'
        keyword['actionSteps'] = [
            {
                'title': '1. 식전 채소·단백질 먼저 먹기',
                'desc': '식사 전에 양배추·브로콜리·오이 같은 채소와 삶은 달걀, 두부 등 간이 심심한 단백질을 먼저 먹습니다.',
                'metric': '식사 전 준비',
            },
            {
                'title': '2. 15분 기다리기',
                'desc': '식전 음식 섭취 후 약 15분, 또는 다 먹은 뒤 최소 10분을 기다려 다음 식사를 시작합니다.',
                'metric': '10~15분 대기',
            },
            {
                'title': '3. 탄수화물은 절반만 먹기',
                'desc': '기다린 뒤 밥·면 등 본식을 먹되, 탄수화물은 평소 양의 절반 정도로 줄여 섭취합니다.',
                'metric': '평소의 1/2',
            },
        ]
        keyword['keyRules'] = [
            '식전 단백질은 삶은 달걀·두부처럼 간이 심심한 음식을 선택하고 짠 반찬을 먼저 먹지 마세요.',
            '단백질 음료나 프로틴 바는 당류와 탄수화물 함량을 영양성분표로 확인하세요.',
            '혈당강하제를 사용 중이면 식사량과 순서를 바꿀 때 혈당을 확인하고 의료진·영양사와 조정하세요.',
        ]
        keyword['video'] = {
            'title': '혈당 스파이크 잡는 거꾸로 식사법',
            'channel': '제공 영상',
            'youtubeId': 'TXC45kgbcNE',
            'duration': '영상 가이드',
            'summary': '채소·단백질을 먼저 먹고 15분 뒤 탄수화물을 절반으로 줄이는 식사법입니다.',
            'difficulty': '초급',
            'targetTimePerDay': '매 끼니 적용',
        }
        break
    break
else:
    raise SystemExit('diabetes condition not found')

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('updated diabetes-diet')
