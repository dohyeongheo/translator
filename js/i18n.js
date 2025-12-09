/**
 * 다국어 지원 데이터
 * @type {Object}
 */
const I18N = {
    ko: {
        auto: "자동", ko: "한국어", th: "태국어", en: "영어",
        nuance: "뉘앙스 (Tone)", polite: "예의 바르게", normal: "보통", casual: "편안하게", playful: "장난스럽게",
        placeholder: "여기에 내용을 입력하세요...", translating: "AI 번역 중...",
        error: "오류 발생! 설정(⚙️)에서 API 키를 확인하세요.", copied: "복사되었습니다!",
        wordGuide: "단어/표현 안내", word: "단어", meaning: "의미", example: "예문", pronunciation: "발음",
        ttsPlay: "음성 재생",
        apiKeySaved: "API 키가 저장되었습니다.",
        apiKeyRequired: "API 키를 입력해주세요.",
        apiKeyInvalid: "API 키가 유효하지 않습니다.",
        apiKeyTooShort: "API 키가 너무 짧습니다. 최소 20자 이상이어야 합니다.",
        networkError: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
        translationFailed: "번역에 실패했습니다. 다시 시도해주세요.",
        jsonParseError: "응답 데이터를 처리하는 중 오류가 발생했습니다.",
        invalidResponseFormat: "서버 응답 형식이 올바르지 않습니다.",
        textTooLong: "텍스트가 너무 깁니다. 최대 {maxLength}자까지 입력 가능합니다.",
        copyFailed: "복사 실패",
        apiKeyInvalid401: "API 키가 유효하지 않습니다. (401)",
        apiRequestFailed: "API 요청에 실패했습니다. ({status})",
        ttsError: "음성 재생에 실패했습니다."
    },
    th: {
        auto: "อัตโนมัติ", ko: "เกาหลี", th: "ไทย", en: "อังกฤษ",
        nuance: "น้ำเสียง (Tone)", polite: "สุภาพ", normal: "ทั่วไป", casual: "กันเอง", playful: "ขี้เล่น",
        placeholder: "พิมพ์ข้อความที่นี่...", translating: "กำลังแปล...",
        error: "เกิดข้อผิดพลาด! โปรดตรวจสอบ API Key", copied: "คัดลอกแล้ว!",
        wordGuide: "คำแนะนำคำศัพท์", word: "คำ", meaning: "ความหมาย", example: "ตัวอย่าง", pronunciation: "การออกเสียง",
        ttsPlay: "เล่นเสียง",
        apiKeySaved: "บันทึก API Key แล้ว",
        apiKeyRequired: "กรุณาใส่ API Key",
        apiKeyInvalid: "API Key ไม่ถูกต้อง",
        apiKeyTooShort: "API Key สั้นเกินไป ต้องมีอย่างน้อย 20 ตัวอักษร",
        networkError: "เกิดข้อผิดพลาดเครือข่าย กรุณาลองใหม่อีกครั้ง",
        translationFailed: "การแปลล้มเหลว กรุณาลองใหม่อีกครั้ง",
        jsonParseError: "เกิดข้อผิดพลาดขณะประมวลผลข้อมูลตอบกลับ",
        invalidResponseFormat: "รูปแบบการตอบกลับของเซิร์ฟเวอร์ไม่ถูกต้อง",
        textTooLong: "ข้อความยาวเกินไป สามารถป้อนได้สูงสุด {maxLength} ตัวอักษร",
        copyFailed: "คัดลอกล้มเหลว",
        apiKeyInvalid401: "API Key ไม่ถูกต้อง (401)",
        apiRequestFailed: "คำขอ API ล้มเหลว ({status})",
        ttsError: "การเล่นเสียงล้มเหลว"
    },
    en: {
        auto: "Auto", ko: "Korean", th: "Thai", en: "English",
        nuance: "Nuance", polite: "Polite", normal: "Normal", casual: "Casual", playful: "Playful",
        placeholder: "Type here...", translating: "Translating...",
        error: "Error! Check API Key in Settings.", copied: "Copied!",
        wordGuide: "Word Guide", word: "Word", meaning: "Meaning", example: "Example", pronunciation: "Pronunciation",
        ttsPlay: "Play audio",
        apiKeySaved: "API key saved.",
        apiKeyRequired: "Please enter API key.",
        apiKeyInvalid: "API key is invalid.",
        apiKeyTooShort: "API key is too short. Must be at least 20 characters.",
        networkError: "Network error occurred. Please try again.",
        translationFailed: "Translation failed. Please try again.",
        jsonParseError: "An error occurred while processing the response data.",
        invalidResponseFormat: "Invalid server response format.",
        textTooLong: "Text is too long. Maximum {maxLength} characters allowed.",
        copyFailed: "Copy failed",
        apiKeyInvalid401: "API key is invalid. (401)",
        apiRequestFailed: "API request failed ({status})",
        ttsError: "TTS playback failed"
    }
};

/**
 * UI 언어 설정
 * @param {string} lang - 언어 코드 ('ko', 'th', 'en')
 */
function setUILang(lang) {
    state.uiLang = lang;
    document.querySelectorAll('.ui-lang-btn').forEach(btn => btn.classList.remove('active'));
    const btns = document.querySelectorAll('.ui-lang-btn');
    if (btns.length >= 3) {
        if (lang === 'ko' && btns[0]) btns[0].classList.add('active');
        if (lang === 'th' && btns[1]) btns[1].classList.add('active');
        if (lang === 'en' && btns[2]) btns[2].classList.add('active');
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (I18N[lang] && I18N[lang][key]) el.innerText = I18N[lang][key];
    });
    const inputText = document.getElementById('input-text');
    if (inputText && I18N[lang]) inputText.placeholder = I18N[lang].placeholder;

    // Update word guide toggle text
    const toggleText = document.getElementById('word-guide-toggle-text');
    if (toggleText && I18N[lang] && I18N[lang].wordGuide) {
        toggleText.innerText = I18N[lang].wordGuide;
    }
}

