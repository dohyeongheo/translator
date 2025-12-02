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
        apiKeySaved: "API 키가 저장되었습니다.",
        apiKeyRequired: "API 키를 입력해주세요.",
        apiKeyInvalid: "API 키가 유효하지 않습니다.",
        networkError: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
        translationFailed: "번역에 실패했습니다. 다시 시도해주세요."
    },
    th: {
        auto: "อัตโนมัติ", ko: "เกาหลี", th: "ไทย", en: "อังกฤษ",
        nuance: "น้ำเสียง (Tone)", polite: "สุภาพ", normal: "ทั่วไป", casual: "กันเอง", playful: "ขี้เล่น",
        placeholder: "พิมพ์ข้อความที่นี่...", translating: "กำลังแปล...",
        error: "เกิดข้อผิดพลาด! โปรดตรวจสอบ API Key", copied: "คัดลอกแล้ว!",
        wordGuide: "คำแนะนำคำศัพท์", word: "คำ", meaning: "ความหมาย", example: "ตัวอย่าง", pronunciation: "การออกเสียง",
        apiKeySaved: "บันทึก API Key แล้ว",
        apiKeyRequired: "กรุณาใส่ API Key",
        apiKeyInvalid: "API Key ไม่ถูกต้อง",
        networkError: "เกิดข้อผิดพลาดเครือข่าย กรุณาลองใหม่อีกครั้ง",
        translationFailed: "การแปลล้มเหลว กรุณาลองใหม่อีกครั้ง"
    },
    en: {
        auto: "Auto", ko: "Korean", th: "Thai", en: "English",
        nuance: "Nuance", polite: "Polite", normal: "Normal", casual: "Casual", playful: "Playful",
        placeholder: "Type here...", translating: "Translating...",
        error: "Error! Check API Key in Settings.", copied: "Copied!",
        wordGuide: "Word Guide", word: "Word", meaning: "Meaning", example: "Example", pronunciation: "Pronunciation",
        apiKeySaved: "API key saved.",
        apiKeyRequired: "Please enter API key.",
        apiKeyInvalid: "API key is invalid.",
        networkError: "Network error occurred. Please try again.",
        translationFailed: "Translation failed. Please try again."
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

