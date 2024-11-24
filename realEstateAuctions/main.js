const puppeteer = require('puppeteer');

(async () => {
    try {
        // Launch a headless browser
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: '/usr/bin/chromium-browser'
        });
        const page = await browser.newPage();

        // Navigate to the court auction website
        await page.goto('https://www.courtauction.go.kr', { waitUntil: 'networkidle2' });
 
        console.log('load courtauction complete')

        await page.waitForFrame()

        // qk_srch_link_1
        console.log(page.contentFrame)

        // Wait for the main content to load (adjust selector as needed)
        // await page.waitForFrame('indexFrame');
        // await page.waitForSelector('.main-content'); // Replace '.main-content' with an actual selector from the site
        // console.log('load main content complete')

        // Extract auction data (modify selectors based on the site's HTML structure)
        const auctionData = await page.evaluate(() => {
            const data = [];
            const rows = document.querySelectorAll('.auction-list .item'); // Replace with actual selectors
            console.log(rows)

            rows.forEach((row) => {
                const title = row.querySelector('.title')?.innerText.trim(); // Replace '.title' with actual selector
                const location = row.querySelector('.location')?.innerText.trim(); // Replace '.location' with actual selector
                const price = row.querySelector('.price')?.innerText.trim(); // Replace '.price' with actual selector

                data.push({ title, location, price });
            });

            return data;
        });

        console.log('Auction Data:', auctionData);

        // Close the browser
        await browser.close();
    } catch (error) {
        console.error('Error:', error);
    }
})();

// (async () => {
//     const response = await fetch("https://www.courtauction.go.kr/RetrieveRealEstMulDetailList.laf", {
//         "headers": {
//             "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//             "accept-language": "ko,en-US;q=0.9,en;q=0.8",
//             "cache-control": "max-age=0",
//             "content-type": "application/x-www-form-urlencoded",
//             "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
//             "sec-ch-ua-mobile": "?0",
//             "sec-ch-ua-platform": "\"Windows\"",
//             "sec-fetch-dest": "frame",
//             "sec-fetch-mode": "navigate",
//             "sec-fetch-site": "same-origin",
//             "sec-fetch-user": "?1",
//             "upgrade-insecure-requests": "1",
//             "cookie": "WMONID=MJ2AvNBVUmh; realJiwonNm=%BC%AD%BF%EF%C1%DF%BE%D3%C1%F6%B9%E6%B9%FD%BF%F8; daepyoSidoCd=; daepyoSiguCd=; rd1Cd=; rd2Cd=; realVowel=35207_45207; JSESSIONID=mNEVhoBTbJBU1eykIzbeUj3eaaxHEaxdEi3IAGL6ul1NoW6PvmWQ7Va2zyvqbHMf.amV1c19kb21haW4vYWlzMg==",
//             "Referer": "https://www.courtauction.go.kr/InitMulSrch.laf",
//             "Referrer-Policy": "strict-origin-when-cross-origin"
//         },
//         "body": "bubwLocGubun=1&jiwonNm=%BC%AD%BF%EF%C1%DF%BE%D3%C1%F6%B9%E6%B9%FD%BF%F8&jpDeptCd=000000&daepyoSidoCd=&daepyoSiguCd=&daepyoDongCd=&notifyLoc=on&rd1Cd=&rd2Cd=&realVowel=35207_45207&rd3Rd4Cd=&notifyRealRoad=on&saYear=2024&saSer=&ipchalGbncd=000331&termStartDt=2024.11.24&termEndDt=2024.12.08&lclsUtilCd=&mclsUtilCd=&sclsUtilCd=&gamEvalAmtGuganMin=&gamEvalAmtGuganMax=&notifyMinMgakPrcMin=&notifyMinMgakPrcMax=&areaGuganMin=&areaGuganMax=&yuchalCntGuganMin=&yuchalCntGuganMax=&notifyMinMgakPrcRateMin=&notifyMinMgakPrcRateMax=&srchJogKindcd=&mvRealGbncd=00031R&srnID=PNO102001&_NAVI_CMD=&_NAVI_SRNID=&_SRCH_SRNID=PNO102001&_CUR_CMD=InitMulSrch.laf&_CUR_SRNID=PNO102001&_NEXT_CMD=RetrieveRealEstMulDetailList.laf&_NEXT_SRNID=PNO102002&_PRE_SRNID=&_LOGOUT_CHK=&_FORM_YN=Y",
//         "method": "POST"
//     });

//     fetch("https://www.courtauction.go.kr/RetrieveRealEstMulDetailList.laf", {
//         "headers": {
//             "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//             "accept-language": "ko,en-US;q=0.9,en;q=0.8",
//             "cache-control": "max-age=0",
//             "content-type": "application/x-www-form-urlencoded",
//             "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
//             "sec-ch-ua-mobile": "?0",
//             "sec-ch-ua-platform": "\"Windows\"",
//             "sec-fetch-dest": "frame",
//             "sec-fetch-mode": "navigate",
//             "sec-fetch-site": "same-origin",
//             "sec-fetch-user": "?1",
//             "upgrade-insecure-requests": "1",
//             "cookie": "WMONID=MJ2AvNBVUmh; realJiwonNm=%BC%AD%BF%EF%C1%DF%BE%D3%C1%F6%B9%E6%B9%FD%BF%F8; daepyoSidoCd=; daepyoSiguCd=; rd1Cd=; rd2Cd=; realVowel=35207_45207; JSESSIONID=mNEVhoBTbJBU1eykIzbeUj3eaaxHEaxdEi3IAGL6ul1NoW6PvmWQ7Va2zyvqbHMf.amV1c19kb21haW4vYWlzMg==",
//             "Referer": "https://www.courtauction.go.kr/RetrieveRealEstMulDetailList.laf",
//             "Referrer-Policy": "strict-origin-when-cross-origin"
//         },
//         "body": "page=default20&bubwLocGubun=1&jiwonNm=%BC%AD%BF%EF%C1%DF%BE%D3%C1%F6%B9%E6%B9%FD%BF%F8&jpDeptCd=000000&daepyoSidoCd=&daepyoSiguCd=&daepyoDongCd=&notifyLoc=on&rd1Cd=&rd2Cd=&realVowel=35207_45207&rd3Rd4Cd=&notifyRealRoad=on&saYear=2024&saSer=&ipchalGbncd=000331&termStartDt=2024.11.24&termEndDt=2024.12.08&lclsUtilCd=&mclsUtilCd=&sclsUtilCd=&gamEvalAmtGuganMin=&gamEvalAmtGuganMax=&notifyMinMgakPrcMin=&notifyMinMgakPrcMax=&areaGuganMin=&areaGuganMax=&yuchalCntGuganMin=&yuchalCntGuganMax=&notifyMinMgakPrcRateMin=&notifyMinMgakPrcRateMax=&srchJogKindcd=&mvRealGbncd=00031R&srnID=PNO102001&_NAVI_CMD=&_NAVI_SRNID=&_SRCH_SRNID=PNO102001&_CUR_CMD=InitMulSrch.laf&_CUR_SRNID=PNO102001&_NEXT_CMD=&_NEXT_SRNID=PNO102002&_PRE_SRNID=&_LOGOUT_CHK=&_FORM_YN=Y&page=default20&PNIPassMsg=%C1%A4%C3%A5%BF%A1+%C0%C7%C7%D8+%C2%F7%B4%DC%B5%C8+%C7%D8%BF%DCIP+%BB%E7%BF%EB%C0%DA%C0%D4%B4%CF%B4%D9.&pageSpec=default20&targetRow=21&lafjOrderBy=",
//         "method": "POST"
//     });

//     fetch("https://www.courtauction.go.kr/RetrieveRealEstMulDetailList.laf", {
//         "headers": {
//             "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//             "accept-language": "ko,en-US;q=0.9,en;q=0.8",
//             "cache-control": "max-age=0",
//             "content-type": "application/x-www-form-urlencoded",
//             "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
//             "sec-ch-ua-mobile": "?0",
//             "sec-ch-ua-platform": "\"Windows\"",
//             "sec-fetch-dest": "frame",
//             "sec-fetch-mode": "navigate",
//             "sec-fetch-site": "same-origin",
//             "sec-fetch-user": "?1",
//             "upgrade-insecure-requests": "1",
//             "cookie": "WMONID=MJ2AvNBVUmh; realJiwonNm=%BC%AD%BF%EF%C1%DF%BE%D3%C1%F6%B9%E6%B9%FD%BF%F8; daepyoSidoCd=; daepyoSiguCd=; rd1Cd=; rd2Cd=; realVowel=35207_45207; JSESSIONID=mNEVhoBTbJBU1eykIzbeUj3eaaxHEaxdEi3IAGL6ul1NoW6PvmWQ7Va2zyvqbHMf.amV1c19kb21haW4vYWlzMg==; page=default20",
//             "Referer": "https://www.courtauction.go.kr/RetrieveRealEstMulDetailList.laf",
//             "Referrer-Policy": "strict-origin-when-cross-origin"
//         },
//         "body": "page=default20&page=default20&bubwLocGubun=1&jiwonNm=%BC%AD%BF%EF%C1%DF%BE%D3%C1%F6%B9%E6%B9%FD%BF%F8&jpDeptCd=000000&daepyoSidoCd=&daepyoSiguCd=&daepyoDongCd=&notifyLoc=on&rd1Cd=&rd2Cd=&realVowel=35207_45207&rd3Rd4Cd=&notifyRealRoad=on&saYear=2024&saSer=&ipchalGbncd=000331&termStartDt=2024.11.24&termEndDt=2024.12.08&lclsUtilCd=&mclsUtilCd=&sclsUtilCd=&gamEvalAmtGuganMin=&gamEvalAmtGuganMax=&notifyMinMgakPrcMin=&notifyMinMgakPrcMax=&areaGuganMin=&areaGuganMax=&yuchalCntGuganMin=&yuchalCntGuganMax=&notifyMinMgakPrcRateMin=&notifyMinMgakPrcRateMax=&srchJogKindcd=&mvRealGbncd=00031R&srnID=PNO102001&_NAVI_CMD=&_NAVI_SRNID=&_SRCH_SRNID=PNO102001&_CUR_CMD=InitMulSrch.laf&_CUR_SRNID=PNO102001&_NEXT_CMD=&_NEXT_SRNID=PNO102002&_PRE_SRNID=&_LOGOUT_CHK=&_FORM_YN=Y&PNIPassMsg=%C1%A4%C3%A5%BF%A1+%C0%C7%C7%D8+%C2%F7%B4%DC%B5%C8+%C7%D8%BF%DCIP+%BB%E7%BF%EB%C0%DA%C0%D4%B4%CF%B4%D9.&pageSpec=default20&pageSpec=default20&targetRow=41&lafjOrderBy=",
//         "method": "POST"
//     });

//     console.log(response)
//     console.log(await response.text())
// })()
