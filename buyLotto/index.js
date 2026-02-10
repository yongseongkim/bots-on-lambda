const { chromium } = require("playwright");
const https = require("https");

const ID = process.env.LOTTO_ID;
const PW = process.env.LOTTO_PW;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const NUMBER_OF_TICKETS = 5;

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

async function buy(browser, numberOfPurchase) {
  const context = await browser.newContext();
  const page = await context.newPage({
    locale: "ko-kr",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    isMobile: false,
  });

  await page.addInitScript(() => {
    Object.defineProperty(Object.getPrototypeOf(navigator), "platform", {
      value: "macintel",
    });
  });

  await page.goto("https://www.dhlottery.co.kr/login");
  await page.locator("#inpUserId").fill(ID);
  await page.locator("#inpUserPswdEncn").fill(PW);
  await page.locator("#btnLogin").click();
  console.log("로그인 완료", page.url());

  // Navigate directly to the game page (no iframe needed)
  await page.goto("https://ol.dhlottery.co.kr/olotto/game/game645.do");
  await page.waitForLoadState("networkidle");

  // No iframe - interact directly with the page
  await page.locator("#num2").waitFor({ state: "visible" });
  await page.evaluate(() => selectWayTab(1));
  console.log("자동번호 발급 선택 완료");

  await page.locator("#amoundApply").selectOption(`${numberOfPurchase}`);
  await page.locator("#btnSelectNum").click();
  console.log("수량 선택 완료");

  await page.locator("#btnBuy").click();
  await page.locator('input[onclick*="closepopupLayerConfirm(true)"]').click();
  console.log("구매 확인");

  // Wait for receipt popup to appear
  await page.locator("#popReceipt").waitFor({ state: "visible" });
  console.log("구매 완료");

  const roundText = await page.locator("#buyRound").allInnerTexts();
  console.log(roundText);

  // Extract actual numbers from receipt popup
  const purchaseResults = await page.$$eval("#reportRow > li", (rows) => {
    return rows.map((row) => {
      const label = row.querySelector("strong > span:first-child").textContent.trim();
      const nums = [...row.querySelectorAll(".nums > span")].map((s) => s.textContent.trim());
      return `${label}: ${nums.join(", ")}`;
    });
  });

  if (purchaseResults.length === 0) {
    console.log("구매 기록이 없습니다.");
    purchaseResults.push("구매 기록이 없습니다.");
  } else {
    console.log(purchaseResults);
  }

  await context.close();

  return {
    round: roundText.join(""),
    tickets: purchaseResults,
  };
}

exports.handler = async (event, context) => {
  let browser = null;
  let purchaseResult = null;

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

    purchaseResult = await buy(browser, NUMBER_OF_TICKETS);

    const slackMessage = [
      `*로또 자동 구매 완료* :four_leaf_clover:`,
      `회차: ${purchaseResult.round}`,
      `구매 수량: ${NUMBER_OF_TICKETS}장`,
      ``,
      `*구매 번호:*`,
      ...purchaseResult.tickets.map((t) => `- ${t}`),
    ].join("\n");

    await sendSlackNotification(slackMessage);
    console.log("Slack 알림 전송 완료");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Lotto purchase completed",
        result: purchaseResult,
      }),
    };
  } catch (error) {
    console.error("Error:", error);

    await sendSlackNotification(
      `*로또 구매 실패* :x:\n에러: ${error.message}`
    );

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
