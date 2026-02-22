const { chromium } = require("playwright");
const https = require("https");
const {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand,
} = require("@aws-sdk/client-ssm");

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SYRUP_WAITING_URL =
  process.env.SYRUP_WAITING_URL ||
  "https://wait.syrupfriends.com/waiting/link/XlGXn1Qav79OJGqu";

const SSM_PREFIX = "/syrup-waiting";
const ssmClient = new SSMClient({ region: "ap-northeast-2" });

async function sendSlackNotification(message) {
  return new Promise((resolve, reject) => {
    const url = new URL(SLACK_WEBHOOK_URL);
    const data = JSON.stringify({ text: message });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(body));
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

const CONFIG_PARAM_NAME = `${SSM_PREFIX}/config`;

const DEFAULT_CONFIG = {
  partySize: "",
  phoneNumber: "",
  enabledAm: false,
  enabledPm: false,
  enabledWeekday: false,
  enabledWeekend: false,
};

async function getConfig() {
  try {
    const result = await ssmClient.send(
      new GetParameterCommand({ Name: CONFIG_PARAM_NAME })
    );
    return { ...DEFAULT_CONFIG, ...JSON.parse(result.Parameter.Value) };
  } catch (err) {
    if (err.name === "ParameterNotFound") return { ...DEFAULT_CONFIG };
    throw err;
  }
}

async function saveConfig(config) {
  await ssmClient.send(
    new PutParameterCommand({
      Name: CONFIG_PARAM_NAME,
      Value: JSON.stringify(config),
      Type: "String",
      Overwrite: true,
    })
  );
}

function parseSlashCommand(body) {
  const params = new URLSearchParams(body);
  const text = (params.get("text") || "").trim();
  return text;
}

const CONFIG_KEYS = {
  am: "enabledAm",
  pm: "enabledPm",
  weekday: "enabledWeekday",
  weekend: "enabledWeekend",
};

const CONFIG_LABELS = {
  am: "오전",
  pm: "오후",
  weekday: "평일",
  weekend: "주말",
};

async function handleSlashCommand(text) {
  // "/waiting off" - 전체 비활성화
  if (text === "off") {
    const config = await getConfig();
    config.enabledAm = false;
    config.enabledPm = false;
    config.enabledWeekday = false;
    config.enabledWeekend = false;
    await saveConfig(config);
    return { statusCode: 200, body: "전체 비활성화 완료" };
  }

  // "/waiting am on|off", "/waiting pm on|off", "/waiting weekday on|off", "/waiting weekend on|off"
  const slotMatch = text.match(/^(am|pm|weekday|weekend)\s+(on|off)$/);
  if (slotMatch) {
    const slot = slotMatch[1];
    const isOn = slotMatch[2] === "on";
    const config = await getConfig();
    config[CONFIG_KEYS[slot]] = isOn;
    await saveConfig(config);
    return {
      statusCode: 200,
      body: `${CONFIG_LABELS[slot]} ${isOn ? "활성화" : "비활성화"} 완료`,
    };
  }

  if (text === "status") {
    const config = await getConfig();
    const amStatus = config.enabledAm ? "ON" : "OFF";
    const pmStatus = config.enabledPm ? "ON" : "OFF";
    const weekdayStatus = config.enabledWeekday ? "ON" : "OFF";
    const weekendStatus = config.enabledWeekend ? "ON" : "OFF";
    return {
      statusCode: 200,
      body: `${config.partySize || "-"}명, ${config.phoneNumber || "-"}\n오전: ${amStatus} / 오후: ${pmStatus}\n평일: ${weekdayStatus} / 주말: ${weekendStatus}`,
    };
  }

  // "/waiting 3 01012345678" - 등록 (전체 활성화)
  const parts = text.split(/\s+/);
  if (parts.length === 2) {
    const partySize = parts[0];
    const phoneNumber = parts[1];

    if (!/^\d+$/.test(partySize) || !/^\d{10,11}$/.test(phoneNumber)) {
      return {
        statusCode: 200,
        body: "형식: /waiting [인원수] [전화번호]\n예: /waiting 3 01012345678",
      };
    }

    await saveConfig({
      partySize,
      phoneNumber,
      enabledAm: true,
      enabledPm: true,
      enabledWeekday: true,
      enabledWeekend: true,
    });

    return {
      statusCode: 200,
      body: `등록 완료: ${partySize}명, ${phoneNumber} (오전/오후, 평일/주말 모두 활성)`,
    };
  }

  return {
    statusCode: 200,
    body: [
      "사용법:",
      "/waiting [인원수] [전화번호] - 등록 (전체 활성)",
      "/waiting am on|off - 오전(10시) 켜기/끄기",
      "/waiting pm on|off - 오후(16시) 켜기/끄기",
      "/waiting weekday on|off - 평일 켜기/끄기",
      "/waiting weekend on|off - 주말 켜기/끄기",
      "/waiting off - 전체 비활성화",
      "/waiting status - 현재 설정 조회",
    ].join("\n"),
  };
}

async function registerWaiting(browser, partySize, phoneNumber) {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Step 1: 웨이팅 링크로 이동 (자동으로 세션 연결)
  await page.goto(SYRUP_WAITING_URL);
  await page.waitForLoadState("networkidle");
  console.log("웨이팅 페이지 도착:", page.url());

  // Step 1: 인원수 설정 (기본 1명이므로 partySize - 1번 + 버튼 클릭)
  const plusButton = page.locator("button.button-updown").nth(1);
  await plusButton.waitFor({ state: "visible" });
  for (let i = 0; i < partySize - 1; i++) {
    await plusButton.click();
    await page.waitForTimeout(200);
  }
  console.log(`인원수 ${partySize}명 설정 완료`);

  // 전화번호 입력
  const phoneInput = page.locator("#test_input");
  await phoneInput.waitFor({ state: "visible" });
  const normalizedPhone = phoneNumber.replace(/[^0-9]/g, "");
  await phoneInput.fill(normalizedPhone);
  console.log("전화번호 입력 완료");

  // 다음 버튼 클릭
  const nextButton = page.locator(".button-next");
  await nextButton.waitFor({ state: "visible" });
  // enabled 상태가 될 때까지 대기
  await page.waitForFunction(
    () => {
      const btn = document.querySelector(".button-next");
      return btn && !btn.disabled;
    },
    { timeout: 10000 }
  );
  await nextButton.click();
  console.log("Step 1 완료 - 다음 클릭");

  // Step 2: 확인 페이지
  await page.locator(".info-group-step3").waitFor({ state: "visible", timeout: 10000 });
  console.log("Step 2 - 확인 페이지 로드");
  const confirmButton = page.locator(".button-next");
  await confirmButton.click();
  console.log("Step 2 완료 - 확인 클릭");

  // Step 3: 완료 페이지 - 결과 읽기
  // Next.js 해시 클래스명 대응을 위해 [class*="..."] 사용
  await page.locator('[class*="wait_text-title"]').first().waitFor({ state: "visible", timeout: 10000 });
  console.log("Step 3 - 완료 페이지 로드");

  const waitNumber = await page
    .locator('[class*="wait_text-title"]')
    .nth(0)
    .innerText();
  const teamsAhead = await page
    .locator('[class*="wait_text-point"]')
    .nth(1)
    .innerText();
  const registrationTime = await page
    .locator('[class*="wait_text-title"]')
    .nth(2)
    .innerText();

  await context.close();

  return {
    waitNumber: waitNumber.trim(),
    teamsAhead: teamsAhead.trim(),
    registrationTime: registrationTime.trim(),
  };
}

exports.handler = async (event, context) => {
  // Slash Command 처리 (event.body 존재 시)
  if (event.body) {
    const body =
      event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf-8")
        : event.body;
    const text = parseSlashCommand(body);
    return handleSlashCommand(text);
  }

  // 스케줄/수동 호출
  // EventBridge에서 { "slot": "am" } 또는 { "slot": "pm" } 전달
  const slot = event.slot || "am";
  const slotLabel = slot === "am" ? "오전" : "오후";

  const config = await getConfig();

  // KST 기준 요일 확인 (UTC+9)
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dayOfWeek = nowKST.getUTCDay(); // 0=일, 6=토
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayTypeEnabled = isWeekend ? config.enabledWeekend : config.enabledWeekday;

  if (!dayTypeEnabled) {
    console.log(`${isWeekend ? "주말" : "평일"} 비활성화 상태. 스킵합니다.`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Skipped - ${isWeekend ? "weekend" : "weekday"} disabled` }),
    };
  }

  const slotEnabled = slot === "am" ? config.enabledAm : config.enabledPm;
  if (!slotEnabled || !config.partySize || !config.phoneNumber) {
    console.log(`${slotLabel} 웨이팅 비활성화 상태이거나 설정 없음. 스킵합니다.`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Skipped - ${slot} not enabled or missing config` }),
    };
  }

  const { partySize, phoneNumber } = config;

  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote",
      ],
    });

    // target time까지 대기 (EventBridge가 2분 일찍 트리거하므로)
    const targetHourUTC = slot === "am" ? 1 : 7;
    const now = new Date();
    const target = new Date(now);
    target.setUTCHours(targetHourUTC, 0, 0, 0);
    const waitMs = target.getTime() - now.getTime();
    if (waitMs > 0 && waitMs < 3 * 60 * 1000) {
      console.log(`Target ${slotLabel} 시각까지 ${waitMs}ms 대기`);
      await new Promise((r) => setTimeout(r, waitMs));
    }

    const result = await registerWaiting(
      browser,
      parseInt(partySize, 10),
      phoneNumber
    );

    const slackMessage = [
      `*나니요리 웨이팅 등록 완료* :ramen:`,
      `대기 번호: ${result.waitNumber}`,
      `앞 팀 수: ${result.teamsAhead}`,
      `등록 시간: ${result.registrationTime}`,
      `인원: ${partySize}명`,
    ].join("\n");

    await sendSlackNotification(slackMessage);
    console.log("Slack 알림 전송 완료");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Waiting registration completed",
        result,
      }),
    };
  } catch (error) {
    console.error("Error:", error);

    await sendSlackNotification(
      `*나니요리 웨이팅 등록 실패* :x:\n에러: ${error.message}`
    );

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
