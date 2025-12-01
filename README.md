# AI 뉘앙스 통역기 V11 (Simple)

한국어, 태국어, 영어 간의 AI 기반 번역 애플리케이션입니다. Google Gemini API를 사용하여 자연스러운 번역과 다양한 톤(뉘앙스) 조절을 제공합니다.

## 주요 기능

- **다국어 번역**: 한국어 ↔ 태국어 ↔ 영어 자동 번역
- **자동 언어 감지**: 입력 언어를 자동으로 감지하여 번역
- **뉘앙스 조절**: 4가지 톤 선택 가능
  - 🙏 예의 바르게 (Polite)
  - 😐 보통 (Normal)
  - ☕ 편안하게 (Casual)
  - 😜 장난스럽게 (Playful)
- **UI 다국어 지원**: 한국어, 태국어, 영어 UI 전환
- **TTS (음성 합성)**: 번역 결과를 음성으로 재생
- **결과 복사**: 번역 결과를 클립보드에 복사

## 사용 방법

1. `index.html` 파일을 웹 브라우저에서 열기
2. 설정(⚙️) 버튼을 클릭하여 Google Gemini API 키 입력
3. 원하는 언어와 뉘앙스를 선택
4. 텍스트를 입력하고 전송 버튼 클릭

## API 키 설정

- Google Gemini API 키가 필요합니다
- 설정 모달에서 API 키를 입력하면 브라우저 로컬 스토리지에 저장됩니다
- API 키는 [Google AI Studio](https://makersuite.google.com/app/apikey)에서 발급받을 수 있습니다

## 기술 스택

- HTML5
- JavaScript (Vanilla)
- Google Gemini API (gemini-2.5-flash-preview-09-2025)
- Tailwind CSS
- Font Awesome
- Web Speech API (TTS)

## 브라우저 호환성

- Chrome, Edge, Safari, Firefox 등 최신 브라우저 지원
- 모바일 브라우저 지원

## 배포 방법

### GitHub Pages 배포

1. **GitHub에 저장소 생성**
   - GitHub에서 새 저장소를 생성합니다
   - 저장소 이름을 입력하고 생성합니다

2. **원격 저장소 연결 및 푸시**
   ```bash
   git remote add origin https://github.com/사용자명/저장소명.git
   git branch -M main
   git push -u origin main
   ```

3. **GitHub Pages 활성화**
   - 저장소의 `Settings` → `Pages`로 이동
   - Source를 `GitHub Actions`로 선택
   - 자동으로 배포가 시작됩니다

4. **배포 완료**
   - 몇 분 후 `https://사용자명.github.io/저장소명/`에서 접속 가능합니다
   - GitHub Actions에서 배포 상태를 확인할 수 있습니다

### 로컬 테스트

```bash
# Python을 사용한 간단한 로컬 서버
python -m http.server 8000

# 또는 Node.js의 http-server 사용
npx http-server
```

브라우저에서 `http://localhost:8000`으로 접속하여 테스트할 수 있습니다.

## 자동 커밋 설정

프로젝트에는 자동 커밋 기능이 포함되어 있습니다. 변경사항을 자동으로 커밋하려면:

### 방법 1: 자동 커밋 스크립트 사용

**PowerShell 사용:**
```powershell
.\auto-commit.ps1
```

**배치 파일 사용:**
```cmd
auto-commit.bat
```

스크립트는 다음을 자동으로 수행합니다:
- 모든 변경사항 스테이징
- 변경된 파일 수와 유형 분석
- 자동 커밋 메시지 생성
- 선택적으로 원격 저장소에 푸시

### 방법 2: Git Hook 사용

Git hook이 설정되어 있어 `git commit` 실행 시 자동으로 변경사항을 분석하고 커밋 메시지를 생성합니다.

**커밋 메시지 형식:**
```
Update: Added X file(s). Modified Y file(s). Files: file1, file2, ...
```

### 커밋 예시

```bash
# 일반 커밋 (hook이 자동으로 메시지 생성)
git add .
git commit

# 또는 스크립트 사용
.\auto-commit.ps1
```

## 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.

