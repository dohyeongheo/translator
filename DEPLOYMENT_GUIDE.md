# 배포 가이드 - GitHub Secrets 사용

## GitHub Secrets 설정 완료

다음 3개의 Repository Secrets가 설정되어 있습니다:
- `GEMINI_API_KEY`: Google Gemini API 키
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase Anon Key

## 배포 프로세스

### 1. 자동 배포
- `main` 또는 `master` 브랜치에 푸시하면 자동으로 배포가 시작됩니다
- GitHub Actions가 다음 단계를 실행합니다:
  1. 저장소 체크아웃
  2. **secrets.js 파일 생성** (GitHub Secrets에서 값 읽어오기)
  3. GitHub Pages 설정
  4. 아티팩트 업로드 (secrets.js 포함)
  5. GitHub Pages에 배포

### 2. 수동 배포
- GitHub 저장소 → Actions 탭
- "Deploy to GitHub Pages" 워크플로우 선택
- "Run workflow" 버튼 클릭

## 생성되는 secrets.js 파일

배포 시 다음 내용으로 `js/secrets.js` 파일이 자동 생성됩니다:

```javascript
const SECRETS = {
    GEMINI_API_KEY: 'GitHub Secrets의 GEMINI_API_KEY 값',
    SUPABASE_URL: 'GitHub Secrets의 SUPABASE_URL 값',
    SUPABASE_ANON_KEY: 'GitHub Secrets의 SUPABASE_ANON_KEY 값'
};
```

## 로컬 개발

로컬 개발 시에는 `js/secrets.js` 파일을 직접 수정하여 사용합니다:
- 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다
- 로컬에서만 사용하는 API 키를 입력할 수 있습니다

## 배포 확인

배포가 완료되면:
1. GitHub Actions에서 배포 상태 확인
2. 배포된 사이트에서 번역 기능 테스트
3. 단어장 기능 테스트
4. 브라우저 개발자 도구에서 `js/secrets.js` 파일이 로드되는지 확인

## 문제 해결

### secrets.js가 생성되지 않는 경우
- GitHub Secrets가 올바르게 설정되었는지 확인
- GitHub Actions 로그에서 에러 확인
- 워크플로우 파일의 문법 확인

### API 키가 작동하지 않는 경우
- GitHub Secrets의 값이 올바른지 확인
- 배포된 사이트의 `js/secrets.js` 파일 내용 확인
- 브라우저 콘솔에서 에러 메시지 확인

