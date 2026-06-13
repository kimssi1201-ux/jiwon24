# 정부지원금25 사이트

공공데이터 기반으로 지원금, 환급금, 정책 대출 정보를 검색하는 정적 웹사이트입니다.

## 로컬 파일

현재 전체 사이트 파일은 로컬 작업공간의 `gg24-site/`에 있습니다.

## 공공데이터 갱신

공공데이터포털 API 키는 사이트 코드에 직접 넣지 말고 `.env.local` 또는 실행 환경 변수로 보관합니다.

```text
DATA_GO_KR_SERVICE_KEY=발급받은_공공데이터포털_API_키
```

데이터 갱신 명령:

```powershell
node .\tools\update-gov24-data.mjs --pages 120 --per-page 100 --max-items 12000
```

## 주의

`site-data.js`는 공공데이터 전체를 포함하면 약 9MB 이상으로 커집니다. GitHub Pages 배포 전에는 데이터 갱신 방식과 용량을 확인하세요.
