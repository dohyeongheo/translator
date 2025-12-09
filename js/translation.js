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
           - Example format: "단어가 사용된 표현/문장 (한국어 발음, 한국어 의미)"
           - Example must show a natural sentence or phrase that uses the word/expression in context
           - The example sentence should be in the original language (source language for words from input, target language for words from translation)
           - After the example sentence, add Korean pronunciation and meaning in parentheses
           - Format: "원문 표현/문장 (한국어 발음, 한국어 의미)"
           - For Thai words: "태국어 문장 (한국어 발음, 한국어 의미)"
           - For English words: "English sentence (한국어 발음, 한국어 의미)"
           - For Korean words: "한국어 문장 (한국어 의미)" - pronunciation not needed for Korean
           - Example is REQUIRED, not optional - provide it for ALL items in wordGuide

        Output JSON ONLY: {
            "detectedSource": "LANG_CODE",
            "translatedText": "TEXT",
            "wordGuide": [
                {
                    "word": "원문단어",
                    "meaning": "한국어 의미",
                    "pronunciation": "한글발음 (원문이 태국어일 때만)",
                    "example": "예문 (필수 - 형식: 단어가 사용된 표현/문장 (한국어 발음, 한국어 의미))"
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
        - Example format: "단어가 사용된 표현/문장 (한국어 발음, 한국어 의미)"
        - Example must be a natural sentence or phrase that demonstrates how the word/expression is used in context.
        - The example sentence should be in the original language (source language for words from input, target language for words from translation).
        - After the example sentence, provide Korean pronunciation and meaning in parentheses.
        - For Thai words: Show a Thai sentence using the word, then "(한국어 발음, 한국어 의미)"
        - For English words: Show an English sentence using the word, then "(한국어 발음, 한국어 의미)"
        - For Korean words: Show a Korean sentence using the word, then "(한국어 의미)" - pronunciation not needed.
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
                    throw new Error(I18N[state.uiLang]?.apiKeyInvalid401 || "API Key Invalid (401)");
                }
                if (response.status === 429) {
                    // Rate limit - 지연 후 재시도
                    if (i < retries - 1) {
                        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (i + 1)));
                        continue;
                    }
                }
                const errorMsg = (I18N[state.uiLang]?.apiRequestFailed || "API request failed ({status})")
                    .replace('{status}', response.status);
                throw new Error(errorMsg);
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
                throw new Error(I18N[state.uiLang]?.invalidResponseFormat || "Invalid API response format");
            }

            // JSON 파싱을 별도로 처리하여 파싱 에러는 재시도하지 않도록 함
            let result;
            try {
                const jsonText = data.candidates[0].content.parts[0].text;
                result = JSON.parse(jsonText);
            } catch (parseError) {
                // JSON 파싱 에러는 재시도해도 해결되지 않으므로 즉시 throw
                throw new Error(I18N[state.uiLang]?.jsonParseError || "JSON parsing failed: " + parseError.message);
            }

            return result;

        } catch (error) {
            // JSON 파싱 에러나 응답 형식 에러는 재시도하지 않음
            if (error.message.includes("JSON parsing") || error.message.includes("Invalid API response format") || error.message.includes("invalidResponseFormat")) {
                throw error;
            }

            // 401 에러는 재시도하지 않음 (API 키 문제)
            if (error.message.includes("401") || error.message.includes("API Key Invalid")) {
                throw error;
            }

            // 네트워크 오류인 경우 재시도
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (i + 1)));
                    continue;
                }
                throw new Error(I18N[state.uiLang]?.networkError || "Network error occurred");
            }

            // 마지막 시도이거나 재시도 불가능한 오류인 경우
            if (i === retries - 1) {
                throw error;
            }

            // 재시도 가능한 오류인 경우 (429 등)
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
            const errorMsg = (I18N[state.uiLang]?.textTooLong || "Text is too long. Maximum {maxLength} characters allowed.")
                .replace('{maxLength}', CONFIG.MAX_TEXT_LENGTH);
            throw new Error(errorMsg);
        }

        const prompt = buildTranslationPrompt(text, state.sourceLang, state.targetLang, state.tone);
        const result = await callTranslationAPI(prompt, state.apiKey || defaultApiKey);

        if (!result.translatedText || !result.detectedSource) {
            throw new Error(I18N[state.uiLang]?.invalidResponseFormat || "Invalid translation result format");
        }

        // Ensure wordGuide exists (backward compatibility)
        if (!result.wordGuide) {
            result.wordGuide = [];
        }

        // Store wordGuide and translation data in state for tooltip
        state.currentWordGuide = result.wordGuide || [];
        state.currentTranslationText = result.translatedText || '';
        state.currentDetectedSource = result.detectedSource || '';
        let wordGuideTargetLang = state.targetLang;
        if (wordGuideTargetLang === 'auto') {
            wordGuideTargetLang = (result.detectedSource === 'ko') ? 'th' : 'ko';
        }
        state.currentTargetLang = wordGuideTargetLang;

        // Display results
        displayTranslationResult(result, outputText, spinner);

        // Display word guide
        await displayWordGuide(result.wordGuide, result.detectedSource, wordGuideTargetLang);

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
    try {
        if (!result) {
            console.error('displayTranslationResult: result is null or undefined');
            return;
        }

        if (spinner) spinner.classList.add('hidden');

        if (outputText && result.translatedText) {
            // 텍스트를 설정
            safeSetText(outputText, result.translatedText);
            // 툴팁 기능 부여 (약간의 지연을 두어 DOM이 업데이트된 후 실행)
            setTimeout(() => {
                attachTooltipToTranslationResult();
            }, 100);
        } else if (outputText && !result.translatedText) {
            console.warn('displayTranslationResult: translatedText is missing');
        }

        const detectedLabel = document.getElementById('detected-lang-label');
        if (detectedLabel && result.detectedSource) {
            safeSetText(detectedLabel, result.detectedSource.toUpperCase());
        } else if (detectedLabel && !result.detectedSource) {
            console.warn('displayTranslationResult: detectedSource is missing');
        }

        if (result.translatedText) {
            state.lastResult = result.translatedText;
        }
    } catch (error) {
        console.error('displayTranslationResult error:', error);
        if (spinner) spinner.classList.add('hidden');
    }
}

/**
 * 번역 에러 처리
 * @param {Error} error - 에러 객체
 * @param {HTMLElement} spinner - 로딩 스피너
 * @param {HTMLElement} outputText - 출력 요소
 * @param {HTMLElement} errorLog - 에러 로그 요소
 */
function handleTranslationError(error, spinner, outputText, errorLog) {
    if (spinner) spinner.classList.add('hidden');
    if (outputText) safeSetText(outputText, I18N[state.uiLang]?.error || "An error occurred");
    if (errorLog) {
        safeSetText(errorLog, `Error: ${error.message}`);
        errorLog.classList.remove('hidden');
    }

    if (error.message.includes("401")) {
        setTimeout(() => toggleSettings(), 1500);
    } else if (error.message.includes("Network") || error.message.includes("fetch")) {
        showToast(I18N[state.uiLang]?.networkError || "Network error occurred");
    } else {
        showToast(I18N[state.uiLang]?.translationFailed || "Translation failed");
    }
}

/**
 * 번역 실행 (메인 함수)
 */
async function executeTranslation() {
    const inputTextEl = document.getElementById('input-text');
    if (!inputTextEl) {
        console.error('Input text element not found');
        return;
    }

    const text = inputTextEl.value.trim();
    if (!text) return;

    const resultCard = document.getElementById('result-card');
    const outputText = document.getElementById('output-text');
    const spinner = document.getElementById('loading-spinner');
    const errorLog = document.getElementById('error-log');

    // 필수 DOM 요소 검증
    if (!resultCard || !outputText || !spinner || !errorLog) {
        console.error('Required DOM elements not found');
        showToast(I18N[state.uiLang]?.error || "An error occurred. Please refresh the page.");
        return;
    }

    resultCard.classList.remove('hidden');
    resultCard.classList.remove('animate-pulse');
    spinner.classList.remove('hidden');
    if (errorLog) errorLog.classList.add('hidden');

    try {
        await translateShortText(text, outputText, spinner, errorLog);
    } catch (error) {
        handleTranslationError(error, spinner, outputText, errorLog);
    }
}

