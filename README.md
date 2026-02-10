# bots-on-lambda

AWS Lambda 위에서 돌아가는 봇 모음. 현재 주요 봇은 **buyLotto**(로또 자동 구매)입니다.

## 프로젝트 구조

```
bots-on-lambda/
├── buyLotto/          # 로또 자동 구매 봇
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   ├── ecr-lifecycle-policy.json
│   └── serverless.yml
└── usedSthCrawler/    # (미사용) 중고 크롤러
```

## buyLotto

[dhlottery.co.kr](https://www.dhlottery.co.kr)에서 로또를 자동으로 구매하는 봇입니다.

- **Playwright + Chromium**으로 브라우저 자동화
- 매주 **금요일 20:00 KST** (UTC 11:00) EventBridge 스케줄로 자동 실행
- 자동번호 5장 구매 후 **Slack 웹훅**으로 결과 알림

## 사전 요구사항

- Node.js 22
- Docker
- AWS CLI
- aws-vault

## 환경변수

| 변수 | 설명 |
|---|---|
| `LOTTO_ID` | dhlottery.co.kr 로그인 아이디 |
| `LOTTO_PW` | dhlottery.co.kr 로그인 비밀번호 |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL |

## 빌드 및 배포

```bash
# 1. Docker 이미지 빌드
docker build --platform linux/amd64 --provenance=false -t buy-lotto buyLotto/

# 2. ECR 로그인
aws-vault exec <profile> -- aws ecr get-login-password --region ap-northeast-2 \
  | docker login --username AWS --password-stdin 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com

# 3. 태그 및 푸시
docker tag buy-lotto:latest 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com/buy-lotto:latest
docker push 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com/buy-lotto:latest

# 4. Lambda 함수 업데이트
aws-vault exec <profile> -- aws lambda update-function-code \
  --function-name buy-lotto \
  --image-uri 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com/buy-lotto:latest \
  --region ap-northeast-2

# 5. ECR 수명주기 정책 적용 (오래된 이미지 자동 정리)
aws-vault exec <profile> -- aws ecr put-lifecycle-policy \
  --repository-name buy-lotto \
  --lifecycle-policy-text file://buyLotto/ecr-lifecycle-policy.json \
  --region ap-northeast-2
```

## 로컬 테스트

```bash
cd buyLotto
npm run local
```

환경변수(`LOTTO_ID`, `LOTTO_PW`, `SLACK_WEBHOOK_URL`)를 미리 설정해야 합니다.
