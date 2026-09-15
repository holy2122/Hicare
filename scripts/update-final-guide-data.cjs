const fs = require("fs");
const path = require("path");

const file = path.resolve(__dirname, "../client/public/healthData.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
let subtitleCount = 0;
let removedEnglishNames = 0;

for (const condition of data) {
  if (Object.prototype.hasOwnProperty.call(condition, "englishName")) {
    delete condition.englishName;
    removedEnglishNames += 1;
  }
  for (const keyword of condition.keywords || []) {
    if (!keyword.subtitle.startsWith("기전: ")) {
      keyword.subtitle = `기전: ${keyword.subtitle}`;
      subtitleCount += 1;
    }
    if (condition.id === "diabetes" && keyword.id === "diabetes-exercise") {
      keyword.video.title = "의자를 활용하여 식후 혈당 잡는 5분 운동";
      keyword.video.youtubeId = "kKHxhFA_rr8";
    }
  }
}

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Updated ${subtitleCount} subtitles, removed ${removedEnglishNames} English-name fields, and updated diabetes exercise video.`);
