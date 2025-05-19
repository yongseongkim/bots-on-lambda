import fs from "fs/promises";
import axios from "axios";

export const handler = async () => {
  // 1. 송파구.json 파일에서 조건에 맞는 id 목록 추출
  const data = JSON.parse(await fs.readFile("./송파구.json", "utf-8"));
  const filtered = data.filter(
    (item) =>
      item.type === 0 &&
      typeof item.total_household === "number" &&
      item.total_household >= 500 &&
      item.id
  );
  const ids = Array.from(new Set(filtered.map((item) => item.id)));

  // 2. 각 id에 대해 polygon API 요청
  const results = [];
  for (const id of ids) {
    const url = `https://hogangnono.com/api/v2/apts/${id}/polygon`;
    try {
      const res = await axios.get(url, {
        headers: {
          accept: "application/json",
        },
      });
      results.push({ id, polygon: res.data });
      // 너무 빠른 요청 방지 (0.2~0.5초 랜덤 대기)
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    } catch (e) {
      console.warn(`Error for id ${id}:`, e.response?.status || e.message);
    }
  }

  // 3. 결과를 새로운 JSON 파일로 저장
  await fs.writeFile(
    "./송파구_polygons.json",
    JSON.stringify(results, null, 2),
    "utf-8"
  );
  console.log(`Saved ${results.length} polygons to 송파구_polygons.json`);
};
