const fs = require("fs");
const path = require("path");

const file = path.resolve(__dirname, "../client/public/healthData.json");
const definitions = {
  hypertension: "혈액이 혈관 벽에 가하는 압력이 정상보다 높은 상태로, 방치하면 심장과 혈관에 부담을 주는 만성 질환입니다.",
  diabetes: "인슐린 분비나 기능에 문제가 생겨 혈액 속 포도당(혈당) 수치가 비정상적으로 높아지는 대사 질환입니다.",
  dyslipidemia: "혈액 속에 나쁜 콜레스테롤이나 중성지방이 기준치보다 많아져 혈관 벽에 기름이 쌓이는 상태입니다.",
  liver: "간세포에 지방이 과도하게 쌓이거나 염증이 생겨, 우리 몸의 화학 공장인 간 기능이 떨어지는 상태입니다.",
  ckd: "몸 안의 노폐물을 걸러주는 신장(콩팥)의 필터 기능이 서서히 떨어져 제 역할을 하지 못하는 상태입니다."
};

const data = JSON.parse(fs.readFileSync(file, "utf8"));
for (const condition of data) {
  if (definitions[condition.id]) condition.shortDesc = definitions[condition.id];
}
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Updated ${Object.keys(definitions).length} shared disease definitions.`);
