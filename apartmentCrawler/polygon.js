import fs from "fs/promises";
import path from "path";
import axios from "axios";

export const handler = async () => {
  const dir = "./data/apt";
  const outputDir = "./data/apt_polygon";
  await fs.mkdir(outputDir, { recursive: true }); // 출력 폴더 생성

  const files = await fs.readdir(dir);

  // 구별로 결과 저장
  const guResults = {};

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(dir, file);
    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));

    // 구 이름 추출 (예: 송파구.json → 송파구)
    const guName = path.basename(file, ".json");

    const filtered = data.filter(
      (item) =>
        item.type === 0 &&
        typeof item.total_household === "number" &&
        item.total_household >= 500 &&
        item.id
    );
    const ids = Array.from(new Set(filtered.map((item) => item.id)));

    guResults[guName] = [];

    for (const id of ids) {
      const url = `https://hogangnono.com/api/v2/apts/${id}/polygon`;
      try {
        const res = await axios.get(url, {
          headers: { accept: "application/json" },
        });
        guResults[guName].push({ id, polygon: res.data });
        await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
      } catch (e) {
        console.warn(`[${guName}] Error for id ${id}:`, e.response?.status || e.message);
      }
    }

    // 구별로 파일 저장 (data/apt_polygon 폴더에 저장)
    await fs.writeFile(
      path.join(outputDir, `${guName}_polygons.json`),
      JSON.stringify(guResults[guName], null, 2),
      "utf-8"
    );
    console.log(`[${guName}] Saved ${guResults[guName].length} polygons to ${outputDir}/${guName}_polygons.json`);
  }
};
