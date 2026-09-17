import json
from pathlib import Path

path = Path('/home/ubuntu/health-care-guide/client/public/healthData.json')
data = json.loads(path.read_text())
for disease in data:
    for keyword in disease.get('keywords', []):
        if keyword.get('id') != 'hypertension-monitor':
            continue
        keyword['subtitle'] = '기전: 표준화된 가정혈압 기록으로 실제 혈압 변화를 확인합니다.'
        keyword['shortActionSummary'] = '아침·저녁 2회 측정해 평균을 기록하세요.'
        keyword['actionSteps'] = [
            {'title': '1. 측정 전 30분 준비', 'desc': '카페인·담배·식사·운동을 피하고 술을 마신 상태에서는 측정하지 않습니다. 화장실에 다녀온 뒤 등받이 의자에서 5분 이상 쉽니다.', 'metric': '30분 금지·5분 안정'},
            {'title': '2. 커프 정확히 착용', 'desc': '팔 둘레에 맞는 위팔 자동혈압계를 사용합니다. 커프의 공기를 빼고 팔꿈치 안쪽 동맥 위치에 맞춰 맨살 또는 얇은 옷 위에 손가락 1~2개 여유로 감습니다.', 'metric': '팔꿈치 위 2~3cm'},
            {'title': '3. 심장 높이 자세 유지', 'desc': '커프를 우심방 높이에 두고 팔을 책상에 받칩니다. 등은 등받이에 기대고 양발은 바닥에 두며 다리를 꼬거나 말하거나 움직이지 않습니다.', 'metric': '4점 지지·말하지 않기'},
            {'title': '4. 아침·저녁 2회 기록', 'desc': '아침에는 기상 후 1시간 이내 약 복용·식사 전에, 저녁에는 취침 전에 1~2분 간격으로 2회 측정합니다. 두 값의 평균과 수축기·이완기·맥박을 함께 기록합니다.', 'metric': '1~2분 간격·평균 기록'},
        ]
        keyword['keyRules'] = [
            '가정혈압은 135/85mmHg 이상을 기준으로 보지만, 진단과 약물 조정은 의료진 상담을 우선하세요.',
            '처음에는 양팔을 모두 측정하고 더 높게 나오는 팔을 기준으로 계속 측정하세요.',
            '정기적으로 혈압계를 병원 기기와 비교해 오차를 확인하세요.'
        ]
        keyword['evidence'] = {
            'paperTitle': 'Home blood pressure monitoring: a position statement from the Korean Society of Hypertension Home Blood Pressure Forum',
            'journal': 'Clinical Hypertension',
            'year': 2022,
            'authors': 'Ihm SH, et al.',
            'coreSummary': '가정혈압은 표준화된 자세와 반복 측정이 중요합니다. 아침·저녁에 일정한 조건으로 2회 이상 측정해 평균을 기록하면 진료실 밖 혈압 상태를 파악하는 데 도움이 되며, 한국 가정혈압 고혈압 기준은 135/85mmHg 이상으로 제시됩니다.',
            'sourceUrl': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9526300/',
            'evidenceGrade': '대한고혈압학회 가정혈압 측정 입장문'
        }
        keyword['video'] = {
            'title': '정확한 자가혈압 측정법',
            'channel': '건강 교육 영상',
            'youtubeId': 'eQD00GWVA5g',
            'startSeconds': 25,
            'duration': '약 22분',
            'summary': '커프 착용, 심장 높이 자세, 아침·저녁 2회 측정과 평균 기록법을 따라 하세요.',
            'difficulty': '초급',
            'targetTimePerDay': '아침·저녁 측정'
        }
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('updated hypertension self-measurement guide')
