# AGENTS.md

AWS Lambda에서 실행되는 자동화 봇 모음입니다.

### Requirements

- Node.js 22
- Docker
- AWS CLI / aws-vault

---

## buyLotto

[dhlottery.co.kr](https://www.dhlottery.co.kr)에서 로또를 자동으로 구매하는 봇입니다.

### 환경변수
- `LOTTO_ID` - 동행복권 로그인 ID
- `LOTTO_PW` - 동행복권 로그인 비밀번호
- `SLACK_WEBHOOK_URL` - 결과 알림용 Slack Webhook URL

### Deployment

1. Docker 이미지 빌드
   ```bash
   docker build --platform linux/amd64 --provenance=false -t buy-lotto buyLotto/
   ```
2. ECR 로그인
   ```bash
   aws-vault exec <profile> -- aws ecr get-login-password --region ap-northeast-2 \
     | docker login --username AWS --password-stdin 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com
   ```
3. 태그 및 ECR 푸시
   ```bash
   docker tag buy-lotto:latest 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com/buy-lotto:latest
   docker push 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com/buy-lotto:latest
   ```
4. Lambda 함수 코드 업데이트
   ```bash
   aws-vault exec <profile> -- aws lambda update-function-code \
     --function-name buy-lotto \
     --image-uri 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com/buy-lotto:latest \
     --region ap-northeast-2
   ```
5. ECR 수명주기 정책 적용
   ```bash
   aws-vault exec <profile> -- aws ecr put-lifecycle-policy \
     --repository-name buy-lotto \
     --lifecycle-policy-text file://buyLotto/ecr-lifecycle-policy.json \
     --region ap-northeast-2
   ```

### Lambda 수동 호출

```bash
aws-vault exec <profile> -- aws lambda invoke \
  --function-name buy-lotto \
  --region ap-northeast-2 \
  /tmp/lambda-output.json && cat /tmp/lambda-output.json
```

### CloudWatch 로그 확인

```bash
# 최근 로그 스트림 조회
aws-vault exec <profile> -- aws logs describe-log-streams \
  --log-group-name /aws/lambda/buy-lotto \
  --order-by LastEventTime --descending --limit 3 \
  --region ap-northeast-2

# 최근 로그 이벤트 조회
aws-vault exec <profile> -- aws logs get-log-events \
  --log-group-name /aws/lambda/buy-lotto \
  --log-stream-name "<log-stream-name>" \
  --limit 50 \
  --region ap-northeast-2
```

---

## syrupWaitingForNaniyori

나니요리 라멘집의 [시럽프렌즈](https://wait.syrupfriends.com) 웨이팅을 자동 등록하는 봇입니다.
Slack Slash Command(`/waiting`)로 인원수/전화번호를 미리 등록하면, EventBridge 스케줄에 맞춰 자동 실행됩니다.

### 환경변수
- `SLACK_WEBHOOK_URL` - 결과 알림용 Slack Webhook URL
- `SYRUP_WAITING_URL` - 웨이팅 링크 (기본값: `https://wait.syrupfriends.com/waiting/link/XlGXn1Qav79OJGqu`)

### SSM Parameter Store
- `/syrup-waiting/config` - JSON 설정 (아래 필드 포함)
  ```json
  {
    "partySize": "1",
    "phoneNumber": "01012345678",
    "enabledAm": true,
    "enabledPm": true,
    "enabledWeekday": true,
    "enabledWeekend": true
  }
  ```

### Slack Slash Command
- `/waiting [인원수] [전화번호]` - 등록, 전체 활성화 (예: `/waiting 3 01012345678`)
- `/waiting am on|off` - 오전(10시) 켜기/끄기
- `/waiting pm on|off` - 오후(16시) 켜기/끄기
- `/waiting weekday on|off` - 평일 켜기/끄기
- `/waiting weekend on|off` - 주말 켜기/끄기
- `/waiting off` - 전체 비활성화
- `/waiting status` - 현재 설정 조회

### Deployment

1. Docker 이미지 빌드
   ```bash
   docker build --platform linux/amd64 --provenance=false -t syrup-waiting-for-naniyori syrupWaitingForNaniyori/
   ```
2. ECR 로그인
   ```bash
   aws-vault exec <profile> -- aws ecr get-login-password --region ap-northeast-2 \
     | docker login --username AWS --password-stdin 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com
   ```
3. 태그 및 ECR 푸시
   ```bash
   docker tag syrup-waiting-for-naniyori:latest 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com/syrup-waiting-for-naniyori:latest
   docker push 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com/syrup-waiting-for-naniyori:latest
   ```
4. Lambda 함수 코드 업데이트
   ```bash
   aws-vault exec <profile> -- aws lambda update-function-code \
     --function-name syrup-waiting-for-naniyori \
     --image-uri 084761792497.dkr.ecr.ap-northeast-2.amazonaws.com/syrup-waiting-for-naniyori:latest \
     --region ap-northeast-2
   ```
5. ECR 수명주기 정책 적용
   ```bash
   aws-vault exec <profile> -- aws ecr put-lifecycle-policy \
     --repository-name syrup-waiting-for-naniyori \
     --lifecycle-policy-text file://syrupWaitingForNaniyori/ecr-lifecycle-policy.json \
     --region ap-northeast-2
   ```

### Lambda 수동 호출

```bash
aws-vault exec <profile> -- aws lambda invoke \
  --function-name syrup-waiting-for-naniyori \
  --region ap-northeast-2 \
  /tmp/lambda-output.json && cat /tmp/lambda-output.json
```

### CloudWatch 로그 확인

```bash
# 최근 로그 스트림 조회
aws-vault exec <profile> -- aws logs describe-log-streams \
  --log-group-name /aws/lambda/syrup-waiting-for-naniyori \
  --order-by LastEventTime --descending --limit 3 \
  --region ap-northeast-2

# 최근 로그 이벤트 조회
aws-vault exec <profile> -- aws logs get-log-events \
  --log-group-name /aws/lambda/syrup-waiting-for-naniyori \
  --log-stream-name "<log-stream-name>" \
  --limit 50 \
  --region ap-northeast-2
```

### EventBridge 스케줄 (수동 설정)

화/수/금/토/일 10:00, 16:00 KST에 실행 (월/목 휴무 제외, SSM `enabled-am`/`enabled-pm`으로 개별 제어).
콜드 스타트+Chromium 실행 시간을 감안하여 2분 일찍 트리거하고, 코드에서 정시까지 대기 후 등록:
- `cron(58 0 ? * TUE,WED,FRI,SAT,SUN *)` — 09:58 KST (UTC 00:58), Input: `{ "slot": "am" }` → 10:00에 등록
- `cron(58 6 ? * TUE,WED,FRI,SAT,SUN *)` — 15:58 KST (UTC 06:58), Input: `{ "slot": "pm" }` → 16:00에 등록

### Slack App 설정 (수동)

1. Slack App 생성 → Slash Command `/waiting` 추가
2. Request URL에 Lambda Function URL 설정
3. 워크스페이스에 App 설치
