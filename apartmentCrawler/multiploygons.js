import fs from "fs/promises";
import path from "path";

export const handler = async () => {
  const dir = "./data/apt_polygon";
  const files = await fs.readdir(dir);

  let groupPolygonsStats = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(dir, file);
    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
    const guName = path.basename(file, ".json").replace(/_polygons$/, "");

    console.log(`[${guName}] ${data.length}개`);

    for (const item of data) {
      const groupPolygons = item?.polygon?.groupPolygons;
      if (Array.isArray(groupPolygons)) {
        // groupPolygons: [ [ [ [ {x, y}, ... ], ... ], ... ], ... ]
        groupPolygons.forEach((polygonGroup, idx) => {
          groupPolygonsStats.push({
            gu: guName,
            name:
              groupPolygons.length > 1 ? `${item.name} ${idx + 1}` : item.name,
            groupPolygonsLength: groupPolygons.length, // 1차: group 개수
            polygonGroupLength: polygonGroup.length, // 2차: ring 개수
            rings: polygonGroup.map((ring) => ring.length), // 3차: 각 ring의 {x, y} 점 개수
            // 4차: ring 내부는 {x, y} 객체 배열
          });
        });
      }
    }
  }

  // 통계 출력
  groupPolygonsStats.forEach((stat) => {
    // if (stat.groupPolygonsLength > 1) {
    //   console.log(`=== ${stat.gu} ===`);
    // }
    if (stat.polygonGroupLength > 1) {
      console.log(`=== ${stat.gu} ${stat.name} (${stat.rings.join(", ")}) ===`);
    }
    if (stat.rings.length > 1) {
      stat.rings.forEach((ring, idx) => {
        if (ring > 1) {
          console.log(`  ${idx + 1}: ${ring}`);
        }
      });
    }
  });

  // 필요하다면 json 파일로 저장
  await fs.writeFile(
    "./groupPolygonsStats.json",
    JSON.stringify(groupPolygonsStats, null, 2),
    "utf-8"
  );
};
