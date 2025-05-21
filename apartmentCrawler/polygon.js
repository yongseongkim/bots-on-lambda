import axios from "axios";
import fs from "fs/promises";
import path from "path";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// 병렬 요청 개수 제한
const CONCURRENCY = 5;
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
];

export const handler = async () => {
  const dir = "./data/apt";
  const outputDir = "./data/apt_polygon";
  await fs.mkdir(outputDir, { recursive: true }); // 출력 폴더 생성

  const files = await fs.readdir(dir);

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(dir, file);
    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));

    // 구 이름 추출 (예: 송파구.json → 송파구)
    const guName = path.basename(file, ".json");

    // id, name, address, total_household, building_count를 미리 매핑
    const idMap = {};
    for (const item of data) {
      if (item.id && item.name && item.address) {
        idMap[item.id] = {
          name: item.name,
          type: item.type,
          address: item.address,
          total_household: item.total_household,
          building_count: item.baseinfo?.building_count ?? null,
        };
      }
    }

    const ids = Array.from(new Set(data.map((item) => item.id)));

    const guResults = [];

    console.log(`[${guName}]: ${ids.length}건 polygon 요청`);

    // 병렬 요청 함수
    const fetchPolygon = async (id, idx) => {
      const url = `https://hogangnono.com/api/v2/apts/${id}/polygon`;
      try {
        const userAgent = USER_AGENTS[idx % USER_AGENTS.length];
        const res = await axios.get(url, {
          headers: {
            accept: "application/json",
            "user-agent": userAgent,
          },
        });
        const polygonData = res.data?.data ?? null;
        guResults.push({
          id: id,
          type: idMap[id]?.type ?? null,
          name: idMap[id]?.name ?? null,
          address: idMap[id]?.address ?? null,
          total_household: idMap[id]?.total_household ?? null,
          building_count: idMap[id]?.building_count ?? null,
          polygon: polygonData,
        });
      } catch (e) {
        console.warn(
          `[${guName}] Error for id ${id}:`,
          e.response?.status || e.message
        );
      }
      await sleep(100 + Math.random() * 200);
    };

    // 병렬로 요청 (CONCURRENCY 단위로)
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const chunk = ids.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map((id, idx) => fetchPolygon(id, i + idx)));
    }

    // 구별로 파일 저장 (data/apt_polygon 폴더에 저장)
    await fs.writeFile(
      path.join(outputDir, `${guName}.json`),
      JSON.stringify(guResults, null, 2),
      "utf-8"
    );
    console.log(
      `[${guName}] Saved ${guResults.length} polygons to ${outputDir}/${guName}.json`
    );
  }
};
