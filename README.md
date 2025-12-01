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

1. `App.html` 파일을 웹 브라우저에서 열기
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

## 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.

