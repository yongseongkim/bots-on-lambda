import fs from "fs/promises";
import path from "path";

export const handler = async () => {
  const inputDir = "./data/apt_polygon";
  const outputPath = "./data/polygon_wkt.json";
  const files = await fs.readdir(inputDir);

  // 결과를 지역구별로 저장
  let result = {};

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const guName = path.basename(file, ".json");
    console.log(`Processing ${guName}...`);
    const filePath = path.join(inputDir, file);
    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));

    // 아파트별로 WKT polygon 추출
    data
      .filter((item) => item?.type === 0)
      .filter(
        (item) =>
          (item?.building_count ?? 0) >= 3 && // 건물 수 3개 이상
          (item?.total_household ?? 0) >= 300 // 세대 수 300개 이상
      )
      .forEach((item) => {
        const groupPolygons = item?.polygon?.groupPolygons;
        if (Array.isArray(groupPolygons)) {
          const polygons = groupPolygons[0];
          polygons.forEach((polygon) => {
            // ring: [[{x, y}, ...]]
            const ring = polygon[0];
            if (!ring || ring.length < 3) return;
            const coords = ring.map((p) => `${p.x} ${p.y}`).join(",");
            const first = `${ring[0].x} ${ring[0].y}`;
            const last = `${ring[ring.length - 1].x} ${
              ring[ring.length - 1].y
            }`;
            const closedCoords = last === first ? coords : coords + "," + first;

            // 아파트 이름에 _N 붙이기 (groupPolygons가 2개 이상일 때)
            let aptName =
              groupPolygons.length > 1 ? `${item.name}_${idx + 1}` : item.name;

            // 지역구별로 배열 초기화
            if (!result[guName]) result[guName] = [];

            // 이미 같은 이름의 아파트가 있으면 polygon 배열에 추가, 없으면 새로 push
            let apt = result[guName].find(
              (a) => a.name === aptName && a.address === item.address
            );
            if (!apt) {
              apt = {
                name: aptName,
                address: item.address,
                polygon: [],
              };
              result[guName].push(apt);
            }
            apt.polygon.push(`POLYGON((${closedCoords}))`);
          });
        }
      });
  }

  await fs.writeFile(outputPath, JSON.stringify(result, null, 2), "utf-8");
  console.log(`Saved to ${outputPath}`);
};
