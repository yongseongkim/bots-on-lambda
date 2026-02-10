# AGENTS.md

[dhlottery.co.kr](https://www.dhlottery.co.kr)에서 로또를 자동으로 구매하는 봇입니다.

### Requirements

- Node.js 22
- Docker
- AWS CLI / aws-vault

## Deployment

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
