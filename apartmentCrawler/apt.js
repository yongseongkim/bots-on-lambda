import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer-core";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const seoulDistricts = [
  {
    name: "강남구",
    sw: { lat: 37.464246, lng: 126.989113 },
    ne: { lat: 37.549363, lng: 127.0818126 },
  },
  {
    name: "강동구",
    sw: { lat: 37.5302, lng: 127.1146 },
    ne: { lat: 37.5735, lng: 127.1576 },
  },
  {
    name: "강북구",
    sw: { lat: 37.612, lng: 127.0089 },
    ne: { lat: 37.6476, lng: 127.0367 },
  },
  {
    name: "강서구",
    sw: { lat: 37.5311, lng: 126.7654 },
    ne: { lat: 37.6017, lng: 126.8657 },
  },
  {
    name: "관악구",
    sw: { lat: 37.4292, lng: 126.9007 },
    ne: { lat: 37.4871, lng: 126.9713 },
  },
  {
    name: "광진구",
    sw: { lat: 37.5369, lng: 127.0671 },
    ne: { lat: 37.5663, lng: 127.1162 },
  },
  {
    name: "구로구",
    sw: { lat: 37.4755, lng: 126.8346 },
    ne: { lat: 37.5077, lng: 126.9022 },
  },
  {
    name: "금천구",
    sw: { lat: 37.4459, lng: 126.8852 },
    ne: { lat: 37.4924, lng: 126.9543 },
  },
  {
    name: "노원구",
    sw: { lat: 37.62, lng: 127.0527 },
    ne: { lat: 37.6822, lng: 127.1145 },
  },
  {
    name: "도봉구",
    sw: { lat: 37.6461, lng: 127.0137 },
    ne: { lat: 37.6896, lng: 127.0552 },
  },
  {
    name: "동대문구",
    sw: { lat: 37.5744, lng: 127.0256 },
    ne: { lat: 37.6063, lng: 127.0727 },
  },
  {
    name: "동작구",
    sw: { lat: 37.4809, lng: 126.9006 },
    ne: { lat: 37.5176, lng: 126.9732 },
  },
  {
    name: "마포구",
    sw: { lat: 37.5346, lng: 126.8426 },
    ne: { lat: 37.5826, lng: 126.9603 },
  },
  {
    name: "서대문구",
    sw: { lat: 37.5635, lng: 126.9241 },
    ne: { lat: 37.6067, lng: 126.9732 },
  },
  {
    name: "서초구",
    sw: { lat: 37.4436, lng: 127.0052 },
    ne: { lat: 37.5124, lng: 127.0665 },
  },
  {
    name: "성동구",
    sw: { lat: 37.5407, lng: 127.0216 },
    ne: { lat: 37.5663, lng: 127.0562 },
  },
  {
    name: "성북구",
    sw: { lat: 37.582, lng: 127.0116 },
    ne: { lat: 37.6146, lng: 127.0507 },
  },
  {
    name: "송파구",
    sw: { lat: 37.4568, lng: 127.0636 },
    ne: { lat: 37.5495, lng: 127.155 },
  },
  {
    name: "양천구",
    sw: { lat: 37.5124, lng: 126.8235 },
    ne: { lat: 37.5611, lng: 126.8707 },
  },
  {
    name: "영등포구",
    sw: { lat: 37.4981, lng: 126.8828 },
    ne: { lat: 37.5437, lng: 126.9411 },
  },
  {
    name: "용산구",
    sw: { lat: 37.5172, lng: 126.9568 },
    ne: { lat: 37.5454, lng: 127.0122 },
  },
  {
    name: "은평구",
    sw: { lat: 37.5826, lng: 126.9097 },
    ne: { lat: 37.6476, lng: 126.9637 },
  },
  {
    name: "종로구",
    sw: { lat: 37.5704, lng: 126.9516 },
    ne: { lat: 37.6063, lng: 127.0176 },
  },
  {
    name: "중구",
    sw: { lat: 37.5509, lng: 126.9658 },
    ne: { lat: 37.5663, lng: 127.0196 },
  },
  {
    name: "중랑구",
    sw: { lat: 37.5794, lng: 127.0777 },
    ne: { lat: 37.6185, lng: 127.1176 },
  },
];

// 각 구별로 Grid를 순회하는 generator
function* gridIterator(sw, ne, stepLat, stepLng) {
  for (let lat = sw.lat; lat < ne.lat; lat += stepLat) {
    for (let lng = sw.lng; lng < ne.lng; lng += stepLng) {
      yield {
        center: {
          lat: lat + stepLat / 2,
          lng: lng + stepLng / 2,
        },
      };
    }
  }
}

export const handler = async () => {
  const browser = await puppeteer.launch({
    executablePath: "/opt/homebrew/bin/chromium",
    headless: false,
    defaultViewport: { width: 2400, height: 1200 },
    args: ["--window-size=2400,1200"],
  });

  const page = await browser.newPage();
  // 구별 데이터 누적용 객체
  const districtResults = {};
  for (const d of seoulDistricts) districtResults[d.name] = [];

  // bounding API 응답 가로채기
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/api/apt/bounding")) {
      try {
        const json = await response.json();
        if (json.status === "success" && Array.isArray(json.data)) {
          for (const district of seoulDistricts) {
            const filtered = json.data.filter(
              (item) => item.address && item.address.includes(district.name)
            );
            if (filtered.length > 0) {
              districtResults[district.name].push(...filtered);
            }
          }
        }
      } catch (e) {
        // ignore parse error
      }
    }
  });

  await page.goto("https://hogangnono.com/", { waitUntil: "networkidle2" });
  await page.click('[data-ga-event="intro,closeBtn"]'); // 설치 유도 팝업 닫기

  // // grid 간격 (구마다 너무 촘촘하면 느려질 수 있으니 0.02~0.05 정도 추천)
  const gridStepLat = 0.01;
  const gridStepLng = 0.01;

  for (const district of seoulDistricts) {
    console.log(`=== ${district.name} ===`);
    for (const cell of gridIterator(
      district.sw,
      district.ne,
      gridStepLat,
      gridStepLng
    )) {
      console.log(`지도 중심 (${cell.center.lat}, ${cell.center.lng})`);
      // 지도 중심 좌표를 cell.center로 이동
      await page.evaluate((center) => {
        localStorage.setItem("MAP_ZOOM", "16");
        localStorage.setItem(
          "MAP_CENTER",
          `{"lat": ${center.lat}, "lng": ${center.lng}}`
        );
      }, cell.center);
      await page.reload();

      const randomMs = 1500 + Math.random() * 1500;
      await sleep(randomMs);
    }

    // ★ 중간 저장: id 기준 중복 제거 후 파일로 저장
    const arr = districtResults[district.name];
    const unique = Array.from(
      new Map(arr.map((item) => [item.id, item])).values()
    );

    const outputDir = "./data/apt";
    await fs.mkdir(outputDir, { recursive: true }); // 출력 폴더 생성

    await fs.writeFile(
      path.join(outputDir, `${district.name}.json`),
      JSON.stringify(unique, null, 2),
      "utf-8"
    );
    console.log(`[중간저장] ${district.name} (${unique.length}건)`);
  }

  // await browser.close();
};
