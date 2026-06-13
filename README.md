# 정부지원금25 사이트

공공데이터 기반으로 지원금, 환급금, 정책 대출 정보를 검색하는 정적 웹사이트입니다.

## 구성

- `index.html`: 메인 화면
- `category.html`: 정책 검색 및 필터 화면
- `policy.html`: 정책 상세 화면
- `site.js`: 검색, 필터, 상세 렌더링 기능
- `styles.css`: 화면 스타일
- `site-data.js`: 샘플 정책 데이터
- `tools/update-gov24-data.mjs`: 공공데이터포털 API로 전체 데이터 생성

## 공공데이터 갱신

공공데이터포털 API 키는 사이트 코드에 직접 넣지 말고 `.env.local` 또는 실행 환경 변수로 보관합니다.

```text
DATA_GO_KR_SERVICE_KEY=발급받은_공공데이터포털_API_키
```

데이터 갱신 명령:

```powershell
node .\tools\update-gov24-data.mjs
```

필요하면 가져올 페이지 수를 환경 변수로 조절할 수 있습니다.

```powershell
$env:GOV24_PAGES='120'; $env:GOV24_PER_PAGE='100'; node .\tools\update-gov24-data.mjs
```

## 주의

현재 repo의 `site-data.js`는 샘플 데이터입니다. 공공데이터 전체를 포함하면 약 9MB 이상으로 커지므로, 배포 전에는 `tools/update-gov24-data.mjs`로 최신 데이터를 다시 생성해 사용하세요.
