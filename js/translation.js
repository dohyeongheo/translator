/**
 * 번역 관련 함수
 */

/**
 * 페르소나 설명 생성
 * @param {string} tone - 톤 ('polite', 'normal', 'casual', 'playful')
 * @returns {string} 페르소나 설명
 */
function buildPersonaDescription(tone) {
    let personaDesc = "Gender: Male. ";
    if (tone === 'polite') personaDesc += "Tone: Very Polite & Formal. ";
    else if (tone === 'normal') personaDesc += "Tone: Standard/Neutral. ";
    else if (tone === 'casual') personaDesc += "Tone: Casual/Friendly. ";
    else if (tone === 'playful') personaDesc += "Tone: Witty, Playful. ";
    return personaDesc;
}

/**
 * 번역 프롬프트 생성
 * @param {string} text - 번역할 텍스트
 * @param {string} sourceLang - 소스 언어
 * @param {string} targetLang - 타겟 언어
 * @param {string} tone - 톤
 * @returns {string} 번역 프롬프트
 */
function buildTranslationPrompt(text, sourceLang, targetLang, tone) {
    const personaDesc = buildPersonaDescription(tone);
    return `
        Role: Expert AI Interpreter.
        Input: "${text}"
        Config: Source=${sourceLang}, Target=${targetLang}
        Persona: ${personaDesc}

        Rules:
        1. If Source is 'auto', detect language.
        2. Map languages: ko=Korean, th=Thai, en=English.
        3. If input is Thai/English -> Translate to Korean.
        4. If input is Korean -> Translate to Target (Default Thai).
        5. IMPORTANT: Apply the Persona Tone strictly. For Thai, ALWAYS use 'Krub' (Male ending).
        6. Extract important words/expressions based on the following rules and provide Korean meanings:
           - If source is Thai (th) -> Extract from INPUT TEXT (Thai words)
           - If target is Thai (th) -> Extract from TRANSLATED TEXT (Thai words)
           - If source is English (en) -> Extract from INPUT TEXT (English words)
           - If target is English (en) -> Extract from TRANSLATED TEXT (English words)
           - For short texts (under 50 words): extract at least 5-8 words/expressions
           - For medium texts (50-200 words): extract at least 10-15 words/expressions
           - For long texts (over 200 words): extract at least 15-20 words/expressions or more
           - Include all significant nouns, verbs, adjectives, phrases, and idiomatic expressions
        7. Add "pronunciation" field with Korean pronunciation (한글 발음) for each Thai word in wordGuide.
           - If wordGuide contains Thai words (from source or target), ALWAYS include pronunciation field.
        8. ALWAYS provide "example" field for EVERY word/expression in wordGuide.
           - Example should be a natural sentence using the word/expression in context
           - Example MUST be written in KOREAN (한국어) - translate the example to Korean
           - Example should clearly demonstrate how to use the word/expression in a sentence
           - Example is REQUIRED, not optional - provide it for ALL items in wordGuide
           - Format: "이 단어를 사용한 표현, 문장" (Korean sentence showing word usage)

        Output JSON ONLY: {
            "detectedSource": "LANG_CODE",
            "translatedText": "TEXT",
            "wordGuide": [
                {
                    "word": "원문단어",
                    "meaning": "한국어 의미",
                    "pronunciation": "한글발음 (원문이 태국어일 때만)",
                    "example": "예문 (필수 - 한국어로 작성된 이 단어를 사용한 표현, 문장)"
                }
            ]
        }

        Note:
        - wordGuide extraction rules:
          * Thai -> Korean: Extract Thai words from INPUT TEXT
          * Korean -> Thai: Extract Thai words from TRANSLATED TEXT
          * English -> Korean: Extract English words from INPUT TEXT
          * Korean -> English: Extract English words from TRANSLATED TEXT
          * Thai -> English: Extract Thai words from INPUT TEXT
          * English -> Thai: Extract Thai words from TRANSLATED TEXT
        - wordGuide should contain as many important words/expressions as possible (minimum 8-15 items, more for longer texts).
        - Include all significant vocabulary: nouns, verbs, adjectives, phrases, idioms, and key expressions.
        - Prioritize words that are commonly used, culturally significant, or difficult to understand.
        - ALWAYS provide Korean meanings for all extracted words.
        - If wordGuide contains Thai words, ALWAYS include "pronunciation" field with Korean pronunciation (한글) for each Thai word.
        - ALWAYS provide "example" field for EVERY word/expression - this is REQUIRED, not optional.
        - Example format: Use the word/expression in a natural sentence that clearly demonstrates its usage.
        - Example language: MUST be in KOREAN (한국어) - translate the example sentence to Korean.
        - Example should show "이 단어를 사용한 표현, 문장" in Korean.
        `;
}

/**
 * API 호출 (재시도 로직 포함)
 * @param {string} prompt - 번역 프롬프트
 * @param {string} apiKey - API 키
 * @param {number} retries - 재시도 횟수
 * @returns {Promise<Object>} 번역 결과
 */
async function callTranslationAPI(prompt, apiKey, retries = CONFIG.MAX_RETRIES) {
    const apiLLM = `${CONFIG.API_BASE_URL}/${CONFIG.MODEL_NAME}:generateContent?key=${apiKey}`;

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiLLM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("API Key Invalid (401)");
                }
                if (response.status === 429) {
                    // Rate limit - 지연 후 재시도
                    if (i < retries - 1) {
                        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (i + 1)));
                        continue;
                    }
                }
                throw new Error(`API Request Failed: ${response.status}`);
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
                throw new Error("Invalid API response format");
            }

            const result = JSON.parse(data.candidates[0].content.parts[0].text);
            return result;

        } catch (error) {
            // 네트워크 오류인 경우 재시도
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (i + 1)));
                    continue;
                }
                throw new Error(I18N[state.uiLang].networkError || "Network error occurred");
            }
            // 마지막 시도이거나 재시도 불가능한 오류인 경우
            if (i === retries - 1) {
                throw error;
            }
            // 재시도 가능한 오류인 경우
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (i + 1)));
        }
    }
}

/**
 * 번역 실행
 * @param {string} text - 번역할 텍스트
 * @param {HTMLElement} outputText - 출력 요소
 * @param {HTMLElement} spinner - 로딩 스피너
 * @param {HTMLElement} errorLog - 에러 로그 요소
 */
async function translateShortText(text, outputText, spinner, errorLog) {
    try {
        // 텍스트 길이 검증
        if (text.length > CONFIG.MAX_TEXT_LENGTH) {
            throw new Error(`Text too long. Maximum ${CONFIG.MAX_TEXT_LENGTH} characters allowed.`);
        }

        const prompt = buildTranslationPrompt(text, state.sourceLang, state.targetLang, state.tone);
        const result = await callTranslationAPI(prompt, state.apiKey || defaultApiKey);

        if (!result.translatedText || !result.detectedSource) {
            throw new Error("Invalid translation result format");
        }

        // Ensure wordGuide exists (backward compatibility)
        if (!result.wordGuide) {
            result.wordGuide = [];
        }

        // Display results
        displayTranslationResult(result, outputText, spinner);

        // Display word guide
        let wordGuideTargetLang = state.targetLang;
        if (wordGuideTargetLang === 'auto') {
            wordGuideTargetLang = (result.detectedSource === 'ko') ? 'th' : 'ko';
        }
        displayWordGuide(result.wordGuide, result.detectedSource, wordGuideTargetLang);

        // Play TTS
        let ttsLang = state.targetLang;
        if (ttsLang === 'auto') {
            ttsLang = (result.detectedSource === 'ko') ? 'th' : 'ko';
        }
        state.lastLang = ttsLang;
        playTTS(result.translatedText, ttsLang);

    } catch (error) {
        throw error; // 상위 함수에서 처리
    }
}

/**
 * 번역 결과 표시
 * @param {Object} result - 번역 결과
 * @param {HTMLElement} outputText - 출력 요소
 * @param {HTMLElement} spinner - 로딩 스피너
 */
function displayTranslationResult(result, outputText, spinner) {
    spinner.classList.add('hidden');
    safeSetText(outputText, result.translatedText);
    const detectedLabel = document.getElementById('detected-lang-label');
    if (detectedLabel) safeSetText(detectedLabel, result.detectedSource.toUpperCase());
    state.lastResult = result.translatedText;
}

/**
 * 번역 에러 처리
 * @param {Error} error - 에러 객체
 * @param {HTMLElement} spinner - 로딩 스피너
 * @param {HTMLElement} outputText - 출력 요소
 * @param {HTMLElement} errorLog - 에러 로그 요소
 */
function handleTranslationError(error, spinner, outputText, errorLog) {
    spinner.classList.add('hidden');
    safeSetText(outputText, I18N[state.uiLang].error);
    safeSetText(errorLog, `Error: ${error.message}`);
    errorLog.classList.remove('hidden');

    if (error.message.includes("401")) {
        setTimeout(() => toggleSettings(), 1500);
    } else if (error.message.includes("Network") || error.message.includes("fetch")) {
        showToast(I18N[state.uiLang].networkError || "Network error occurred");
    } else {
        showToast(I18N[state.uiLang].translationFailed || "Translation failed");
    }
}

/**
 * 번역 실행 (메인 함수)
 */
async function executeTranslation() {
    const text = document.getElementById('input-text').value.trim();
    if (!text) return;

    const resultCard = document.getElementById('result-card');
    const outputText = document.getElementById('output-text');
    const spinner = document.getElementById('loading-spinner');
    const errorLog = document.getElementById('error-log');

    resultCard.classList.remove('hidden');
    resultCard.classList.remove('animate-pulse');
    spinner.classList.remove('hidden');
    errorLog.classList.add('hidden');

    try {
        await translateShortText(text, outputText, spinner, errorLog);
    } catch (error) {
        handleTranslationError(error, spinner, outputText, errorLog);
    }
}

