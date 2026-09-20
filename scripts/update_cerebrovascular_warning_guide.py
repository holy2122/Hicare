import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'client' / 'public' / 'healthData.json'
data = json.loads(path.read_text())

for condition in data:
    if condition.get('id') != 'heart':
        continue
    condition['name'] = '뇌심혈관질환'
    condition['shortDesc'] = '평소 뚜렷한 전조 없이 진행될 수 있어 혈압·LDL·당화혈색소 관리와 위험신호 확인이 중요한 질환입니다.'
    condition['badge'] = '뇌혈관·심혈관 위험 관리'
    condition['normalRangeLabel'] = '관리 기준: 혈압·LDL 콜레스테롤·당화혈색소를 정기적으로 확인하고 정상 범위를 유지합니다.'
    condition['observationThreshold'] = '주의 기준: 갑작스러운 한쪽 마비·말 어눌함·시야장애 또는 경험 없는 벼락두통이 나타나면 즉시 119에 신고합니다.'
    for keyword in condition.get('keywords', []):
        if keyword.get('id') != 'heart-red-flags':
            continue
        keyword['tag'] = '뇌졸중 위험신호 대응'
        keyword['title'] = '뇌졸중 신호와 응급대응'
        keyword['subtitle'] = '증상이 잠깐 사라져도 즉시 응급대응합니다.'
        keyword['shortActionSummary'] = '갑작스런 신호면 즉시 119에 신고하세요.'
        keyword['actionSteps'] = [
            {
                'title': '1. 갑작스런 신호 확인',
                'desc': '한쪽 얼굴·팔·다리 마비, 말이 어눌해짐, 한쪽 시야장애가 갑자기 생겼는지 확인합니다. 몇 분 뒤 사라져도 안심하지 않습니다.',
                'metric': '잠깐 사라져도 응급',
            },
            {
                'title': '2. 119 신고 후 안전하게 대기',
                'desc': '증상이 의심되면 즉시 119에 신고하고 환자를 편안하게 눕혀 구급대를 기다립니다. 직접 운전하지 않습니다.',
                'metric': '시간 기록하기',
            },
            {
                'title': '3. 금지 행동과 CPR 확인',
                'desc': '물·음식·우황청심환을 먹이지 말고 손발을 따거나 주무르지 않습니다. 의식과 호흡이 없으면 119 신고와 함께 CPR을 시작합니다.',
                'metric': '호흡 없으면 CPR',
            },
        ]
        keyword['keyRules'] = [
            '증상이 정상으로 돌아와도 일과성 허혈 발작일 수 있으므로 기다리지 말고 즉시 119에 신고하세요.',
            '의식이 있는 환자에게 물·음식·약을 임의로 먹이지 말고, 의식과 호흡이 없으면 CPR과 AED 안내를 따르세요.',
        ]
        keyword['evidence'] = {
            'paperTitle': 'Guidelines for the Early Management of Patients With Acute Ischemic Stroke',
            'journal': 'Stroke',
            'year': 2019,
            'authors': 'Powers WJ, Rabinstein AA, Ackerson T, et al.',
            'coreSummary': '뇌졸중 증상은 발생 시각을 기록하고 가능한 한 빠르게 응급의료체계로 연결해야 하며, 증상이 사라진 일과성 허혈 발작도 후속 뇌졸중 위험 평가가 필요한 응급 상황입니다.',
            'sourceUrl': 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000211',
            'evidenceGrade': 'AHA/ASA Clinical Practice Guideline',
        }
        keyword['video'] = {
            'title': '뇌졸중 전조증상과 응급대응',
            'channel': '유튜브 영상',
            'youtubeId': 'a1ZhicYWdjY',
            'duration': '영상 가이드',
            'summary': '뇌졸중은 뚜렷한 전조 없이 발생할 수 있으며, 갑작스러운 마비·언어장애·시야장애와 벼락두통이 나타나면 119 신고와 신속한 대응이 필요하다고 설명합니다.',
            'difficulty': '초급',
            'targetTimePerDay': '증상 발생 시',
        }
        break
    else:
        raise SystemExit('warning-sign keyword not found')
    break
else:
    raise SystemExit('heart condition not found')

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('updated cerebrovascular criteria and warning-sign guide')
