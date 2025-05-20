import fs from "fs/promises";
import path from "path";

const NAVER_MAP_CLIENT_ID = "6sjdfnjhqu"; // 네이버 클라우드 플랫폼에서 발급받은 clientId로 교체

export const handler = async () => {
  const inputDir = "./data/apt_polygon";
  const outputDir = "./data/html";
  await fs.mkdir(outputDir, { recursive: true });

  const files = await fs.readdir(inputDir);

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(inputDir, file);
    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));

    // groupPolygons를 flat하게 추출
    let polygons = [];
    data.forEach((item) => {
      const groupPolygons = item?.polygon?.groupPolygons;
      if (Array.isArray(groupPolygons)) {
        groupPolygons.forEach((polygonGroup) => {
          polygonGroup.forEach((ring) => {
            polygons.push(ring[0]); // ring: [{x, y}, ...]
          });
        });
      }
    });

    // 중심좌표 계산 (첫 번째 ring의 첫 번째 좌표 사용, 없으면 서울시청)
    let center = { lat: 37.5665, lng: 126.978 };
    if (polygons.length > 0 && polygons[0].length > 0) {
      center = { lat: polygons[0][0].y, lng: polygons[0][0].x };
    }

    // polygon 데이터 JS 배열로 변환
    const polygonsJS = polygons
      .map((ring) => `[${ring.map((p) => `[${p.x}, ${p.y}]`).join(", ")}]`)
      .join(",\n");

    // HTML 생성
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${file.replace(".json", "")} Polygon Map</title>
  <style>
    #map { width: 100vw; height: 100vh; }
  </style>
  <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_MAP_CLIENT_ID}"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = new naver.maps.Map('map', {
      center: new naver.maps.LatLng(${center.lat}, ${center.lng}),
      zoom: 14
    });

    var polygons = [
      ${polygonsJS}
    ];

    polygons.forEach(function(path) {
      new naver.maps.Polygon({
        map: map,
        paths: [path.map(function(coord) { return new naver.maps.LatLng(coord[1], coord[0]); })],
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.2
      });
    });
  </script>
</body>
</html>
`;

    const guName = path.basename(file, ".json");
    await fs.writeFile(
      path.join(outputDir, `${guName}_polygon_map.html`),
      html,
      "utf-8"
    );
  }
};
