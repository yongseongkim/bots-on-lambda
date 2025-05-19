import fs from "fs/promises";

export const handler = async () => {
  const data = JSON.parse(await fs.readFile("./송파구_polygons.json", "utf-8"));

  const flatList = data
    .map((item) => item?.polygon?.data?.groupPolygons)
    .filter(Boolean)
    .flat(3); // 2단계 평탄화하여 [{x, y}, ...] 리스트만 남김

  await fs.writeFile(
    "./groupPolygonsList.json",
    JSON.stringify(flatList, null, 2),
    "utf-8"
  );
};
