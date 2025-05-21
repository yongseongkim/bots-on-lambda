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
    sw: { lat: 37.517648, lng: 127.112757 },
    ne: { lat: 37.5813619, lng: 127.1847987 },
  },
  {
    name: "강북구",
    sw: { lat: 37.6109298, lng: 126.9970592 },
    ne: { lat: 37.6684294, lng: 127.0477852 },
  },
  {
    name: "강서구",
    sw: { lat: 37.5214073, lng: 126.7674894 },
    ne: { lat: 37.5787976, lng: 126.9111852 },
  },
  {
    name: "관악구",
    sw: { lat: 37.4389137, lng: 126.8967017 },
    ne: { lat: 37.5015851, lng: 126.9875106 },
  },
  {
    name: "광진구",
    sw: { lat: 37.5238168, lng: 127.0542475 },
    ne: { lat: 37.5682856, lng: 127.120103 },
  },
  {
    name: "구로구",
    sw: { lat: 37.468621, lng: 126.8136176 },
    ne: { lat: 37.517381, lng: 126.9085463 },
  },
  {
    name: "금천구",
    sw: { lat: 37.4380277, lng: 126.8668112 },
    ne: { lat: 37.4874886, lng: 126.9152197 },
  },
  {
    name: "노원구",
    sw: { lat: 37.6068501, lng: 127.0481714 },
    ne: { lat: 37.6964155, lng: 127.1108278 },
  },
  {
    name: "도봉구",
    sw: { lat: 37.6461, lng: 127.0137 },
    ne: { lat: 37.6896, lng: 127.0552 },
  },
  {
    name: "동대문구",
    sw: { lat: 37.5591012, lng: 127.0141825 },
    ne: { lat: 37.6063061, lng: 127.0794138 },
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
    sw: { lat: 37.5548146, lng: 126.8948778 },
    ne: { lat: 37.6143973, lng: 126.9666323 },
  },
  {
    name: "서초구",
    sw: { lat: 37.4453876, lng: 126.9827684 },
    ne: { lat: 37.5325609, lng: 37.5325609 },
  },
  {
    name: "성동구",
    sw: { lat: 37.5309273, lng: 127.0095476 },
    ne: { lat: 37.5717556, lng: 127.0861086 },
  },
  {
    name: "성북구",
    sw: { lat: 37.584952, lng: 126.9755586 },
    ne: { lat: 37.6146, lng: 127.0507 },
  },
  {
    name: "송파구",
    sw: { lat: 37.4568, lng: 127.0636 },
    ne: { lat: 37.5495, lng: 127.155 },
  },
  {
    name: "양천구",
    sw: { lat: 37.501721, lng: 126.8100771 },
    ne: { lat: 37.5486904, lng: 126.885951 },
  },
  {
    name: "영등포구",
    sw: { lat: 37.4784982, lng: 126.8783125 },
    ne: { lat: 37.5467169, lng: 126.9444021 },
  },
  {
    name: "용산구",
    sw: { lat: 37.5139089, lng: 126.940883 },
    ne: { lat: 37.5593734, lng: 127.0146974 },
  },
  {
    name: "은평구",
    sw: { lat: 37.5826, lng: 126.9097 },
    ne: { lat: 37.6476, lng: 126.9637 },
  },
  {
    name: "종로구",
    sw: { lat: 37.5649525, lng: 126.952041 },
    ne: { lat: 37.6264305, lng: 127.0272287 },
  },
  {
    name: "중구",
    sw: { lat: 37.5519567, lng: 126.9614824 },
    ne: { lat: 37.5762454, lng: 127.0264562 },
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

// 각 구별 크롤링 함수 (브라우저 인스턴스 분리)
async function crawlDistrict(district) {
  const browser = await puppeteer.launch({
    executablePath: "/opt/homebrew/bin/chromium",
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ["--window-size=1200,800"],
  });

  const page = await browser.newPage();
  const districtResults = [];

  // bounding API 응답 가로채기
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/api/apt/bounding")) {
      try {
        const json = await response.json();
        if (json.status === "success" && Array.isArray(json.data)) {
          const filtered = json.data.filter(
            (item) => item.address && item.address.includes(district.name)
          );
          if (filtered.length > 0) {
            districtResults.push(...filtered);
          }
        }
      } catch (e) {
        // ignore parse error
      }
    }
  });

  await page.goto("https://hogangnono.com/", { waitUntil: "networkidle2" });
  try {
    await page.click('[data-ga-event="intro,closeBtn"]');
  } catch (e) {
    // 팝업 없을 수도 있음
  }

  const gridStepLat = 0.011;
  const gridStepLng = 0.011;

  for (const cell of gridIterator(
    district.sw,
    district.ne,
    gridStepLat,
    gridStepLng
  )) {
    console.log(`[${district.name}] 지도 중심 (${cell.center.lat}, ${cell.center.lng})`);
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

  // id 기준 중복 제거 후 파일로 저장
  const arr = districtResults;
  const unique = Array.from(
    new Map(arr.map((item) => [item.id, item])).values()
  );

  const outputDir = "./data/apt";
  await fs.mkdir(outputDir, { recursive: true });

  await fs.writeFile(
    path.join(outputDir, `${district.name}.json`),
    JSON.stringify(unique, null, 2),
    "utf-8"
  );
  console.log(`[저장] ${district.name} (${unique.length}건)`);

  await browser.close();
}

// 병렬 실행 제한 유틸
async function parallelLimit(arr, limit, asyncFn) {
  const ret = [];
  let idx = 0;
  async function next() {
    if (idx >= arr.length) return;
    const cur = idx++;
    await asyncFn(arr[cur]);
    await next();
  }
  const tasks = [];
  for (let i = 0; i < limit; i++) {
    tasks.push(next());
  }
  await Promise.all(tasks);
}

export const handler = async () => {
  // 동시에 3개 브라우저만 실행 (메모리/CPU 상황에 따라 조절)
  await parallelLimit(seoulDistricts, 3, crawlDistrict);
};
