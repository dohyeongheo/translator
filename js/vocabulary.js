/**
 * 단어장 기능
 */

// 저장된 단어 캐시 (word + language 조합으로 저장)
let savedWordsCache = new Map();

/**
 * 저장된 단어 목록 조회 및 캐시 업데이트
 * @param {string} language - 언어 코드
 * @returns {Promise<Set>} 저장된 단어 Set (word 값들)
 */
async function getSavedWords(language) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            return new Set();
        }

        const cacheKey = language;

        // 캐시에 있으면 반환
        if (savedWordsCache.has(cacheKey)) {
            return savedWordsCache.get(cacheKey);
        }

        const { data, error } = await client
            .from('vocabulary')
            .select('word')
            .eq('language', language);

        if (error) {
            console.error('Failed to load saved words:', error);
            return new Set();
        }

        // Set으로 변환하여 캐시에 저장
        const wordSet = new Set((data || []).map(item => item.word));
        savedWordsCache.set(cacheKey, wordSet);

        return wordSet;
    } catch (error) {
        console.error('Error loading saved words:', error);
        return new Set();
    }
}

/**
 * 단어 저장 상태 캐시 업데이트
 * @param {string} language - 언어 코드
 * @param {string} word - 단어
 * @param {boolean} isSaved - 저장 여부
 */
function updateSavedWordsCache(language, word, isSaved) {
    const cacheKey = language;
    if (savedWordsCache.has(cacheKey)) {
        const wordSet = savedWordsCache.get(cacheKey);
        if (isSaved) {
            wordSet.add(word);
        } else {
            wordSet.delete(word);
        }
    } else if (isSaved) {
        // 캐시가 없고 저장하는 경우 새로 생성
        const wordSet = new Set([word]);
        savedWordsCache.set(cacheKey, wordSet);
    }
}

/**
 * 단어를 단어장에 저장
 * @param {Object} wordData - 단어 데이터 {word, meaning, pronunciation, language}
 * @param {HTMLElement} button - 저장 버튼 요소 (선택사항)
 * @param {HTMLElement} icon - 저장 아이콘 요소 (선택사항)
 */
async function saveWordToVocabulary(wordData, button = null, icon = null) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            showToast(I18N[state.uiLang]?.supabaseNotConfigured || 'Supabase가 설정되지 않았습니다. 설정에서 Supabase URL과 키를 입력해주세요.');
            return;
        }

        // 중복 체크
        const { data: existing, error: checkError } = await client
            .from('vocabulary')
            .select('id')
            .eq('word', wordData.word)
            .eq('language', wordData.language)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking duplicate:', checkError);
        }

        if (existing) {
            showToast(I18N[state.uiLang]?.wordAlreadyExists || '이미 저장된 단어입니다.');
            // 저장된 상태로 표시
            if (icon) icon.className = 'fas fa-bookmark text-xs text-yellow-400';
            return;
        }

        // 단어 저장
        const { data, error } = await client
            .from('vocabulary')
            .insert([{
                word: wordData.word,
                meaning: wordData.meaning,
                pronunciation: wordData.pronunciation,
                language: wordData.language
            }])
            .select()
            .single();

        if (error) {
            console.error('Failed to save word:', error);
            showToast(I18N[state.uiLang]?.wordSaveFailed || '단어 저장에 실패했습니다.');
            return;
        }

        // 성공 메시지
        showToast(I18N[state.uiLang]?.wordSaved || '단어가 저장되었습니다.');

        // 버튼 상태 업데이트
        if (icon) {
            icon.className = 'fas fa-bookmark text-xs text-yellow-400';
        }

        // 캐시에 추가
        if (data && data.id) {
            state.savedWords.push(data.id);
            updateSavedWordsCache(wordData.language, wordData.word, true);
        }
    } catch (error) {
        console.error('Error saving word:', error);
        showToast(I18N[state.uiLang]?.wordSaveFailed || '단어 저장에 실패했습니다.');
    }
}

/**
 * 언어별 단어 목록 로드
 * @param {string} language - 언어 코드 ('th', 'ko', 'en')
 * @returns {Promise<Array>} 단어 목록
 */
async function loadVocabulary(language) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            return [];
        }

        const { data, error } = await client
            .from('vocabulary')
            .select('*')
            .eq('language', language)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to load vocabulary:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error loading vocabulary:', error);
        return [];
    }
}

/**
 * 단어 삭제
 * @param {string} wordId - 단어 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
async function deleteWord(wordId) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            return false;
        }

        // 삭제 전에 단어 정보 가져오기
        const { data: wordData } = await client
            .from('vocabulary')
            .select('word, language')
            .eq('id', wordId)
            .single();

        const { error } = await client
            .from('vocabulary')
            .delete()
            .eq('id', wordId);

        if (error) {
            console.error('Failed to delete word:', error);
            return false;
        }

        // 캐시에서 제거
        state.savedWords = state.savedWords.filter(id => id !== wordId);

        // 단어 정보를 가져와서 캐시 업데이트
        if (wordData) {
            updateSavedWordsCache(wordData.language, wordData.word, false);
        }

        return true;
    } catch (error) {
        console.error('Error deleting word:', error);
        return false;
    }
}

// 정렬 상태 저장
let vocabularySortState = { column: null, order: 'asc', words: null };

/**
 * 단어장 테이블 렌더링
 * @param {Array} words - 단어 목록
 * @param {string} language - 언어 코드
 */
function renderVocabularyTable(words, language) {
    const tableContainer = document.getElementById('vocabulary-table-container');
    if (!tableContainer) return;

    // 원본 단어 목록 저장 (정렬용)
    vocabularySortState.words = words;

    // 기존 내용 제거
    tableContainer.innerHTML = '';

    if (!words || words.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center text-gray-400 py-8';
        emptyMessage.textContent = I18N[state.uiLang]?.noWords || '저장된 단어가 없습니다.';
        tableContainer.appendChild(emptyMessage);
        return;
    }

    // 정렬된 배열 복사본 생성
    let sortedWords = [...words];
    if (vocabularySortState.column) {
        sortedWords = sortWords([...words], vocabularySortState.column, vocabularySortState.order);
    }

    // 테이블 생성
    const table = document.createElement('table');
    table.className = 'w-full text-sm';

    // 테이블 헤더
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-800/50';
    thead.innerHTML = `
        <tr>
            <th class="px-4 py-3 text-left cursor-pointer hover:bg-gray-700/50" data-sort="word">
                ${I18N[state.uiLang]?.original || '원문'}
                <i class="fas fa-sort text-xs ml-1"></i>
            </th>
            <th class="px-4 py-3 text-left cursor-pointer hover:bg-gray-700/50" data-sort="pronunciation">
                ${I18N[state.uiLang]?.pronunciation || '발음'}
                <i class="fas fa-sort text-xs ml-1"></i>
            </th>
            <th class="px-4 py-3 text-left cursor-pointer hover:bg-gray-700/50" data-sort="meaning">
                ${I18N[state.uiLang]?.meaning || '의미'}
                <i class="fas fa-sort text-xs ml-1"></i>
            </th>
            <th class="px-4 py-3 text-left cursor-pointer hover:bg-gray-700/50" data-sort="created_at">
                ${I18N[state.uiLang]?.savedDate || '저장 날짜'}
                <i class="fas fa-sort text-xs ml-1"></i>
            </th>
            <th class="px-4 py-3 text-center">${I18N[state.uiLang]?.delete || '삭제'}</th>
        </tr>
    `;

    // 테이블 바디
    const tbody = document.createElement('tbody');
    sortedWords.forEach(word => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-800/30';

        const date = new Date(word.created_at);
        const dateStr = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        row.innerHTML = `
            <td class="px-4 py-3 font-medium">${escapeHtml(word.word || '')}</td>
            <td class="px-4 py-3 text-blue-300">${escapeHtml(word.pronunciation || '-')}</td>
            <td class="px-4 py-3">${escapeHtml(word.meaning || '')}</td>
            <td class="px-4 py-3 text-gray-400 text-xs">${dateStr}</td>
            <td class="px-4 py-3 text-center">
                <button onclick="handleDeleteWord('${word.id}')"
                    class="text-red-400 hover:text-red-300 transition"
                    aria-label="${I18N[state.uiLang]?.delete || '삭제'}">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);

    // 정렬 아이콘 업데이트
    const sortHeaders = thead.querySelectorAll('th[data-sort]');
    sortHeaders.forEach(header => {
        const column = header.getAttribute('data-sort');
        const icon = header.querySelector('i');
        if (icon) {
            if (vocabularySortState.column === column) {
                icon.className = vocabularySortState.order === 'asc'
                    ? 'fas fa-sort-up text-xs ml-1'
                    : 'fas fa-sort-down text-xs ml-1';
            } else {
                icon.className = 'fas fa-sort text-xs ml-1';
            }
        }
    });

    // 정렬 이벤트 리스너 추가
    sortHeaders.forEach(header => {
        // 기존 리스너 제거 (중복 방지)
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);

        newHeader.addEventListener('click', () => {
            const column = newHeader.getAttribute('data-sort');

            // 정렬 순서 토글
            if (vocabularySortState.column === column) {
                vocabularySortState.order = vocabularySortState.order === 'asc' ? 'desc' : 'asc';
            } else {
                vocabularySortState.column = column;
                vocabularySortState.order = 'asc';
            }

            // 테이블 다시 렌더링
            renderVocabularyTable(vocabularySortState.words, language);
        });
    });
}

/**
 * 단어 정렬 (원본 배열 변경하지 않음)
 * @param {Array} words - 단어 목록
 * @param {string} column - 정렬할 컬럼
 * @param {string} order - 정렬 순서 ('asc' 또는 'desc')
 * @returns {Array} 정렬된 새 배열
 */
function sortWords(words, column, order) {
    return [...words].sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';

        // 날짜 정렬
        if (column === 'created_at') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
        } else {
            // 문자열 정렬
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }

        if (order === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
}

/**
 * 단어 삭제 핸들러
 * @param {string} wordId - 단어 ID
 */
async function handleDeleteWord(wordId) {
    if (!confirm(I18N[state.uiLang]?.confirmDelete || '정말 삭제하시겠습니까?')) {
        return;
    }

    const success = await deleteWord(wordId);
    if (success) {
        showToast(I18N[state.uiLang]?.wordDeleted || '단어가 삭제되었습니다.');
        // 현재 언어의 단어 다시 로드
        const currentLang = state.currentVocabularyLanguage || 'th';
        const words = await loadVocabulary(currentLang);
        renderVocabularyTable(words, currentLang);
    } else {
        showToast(I18N[state.uiLang]?.wordDeleteFailed || '단어 삭제에 실패했습니다.');
    }
}

/**
 * 단어장 페이지 표시
 */
async function showVocabularyPage() {
    state.currentPage = 'vocabulary';

    // 번역 페이지 숨기기
    const mainContent = document.querySelector('main');
    const translationSection = document.getElementById('translation-section');
    const vocabularySection = document.getElementById('vocabulary-section');

    if (translationSection) translationSection.classList.add('hidden');
    if (vocabularySection) vocabularySection.classList.remove('hidden');

    // 기본 언어로 단어 로드 (태국어)
    state.currentVocabularyLanguage = 'th';
    await loadAndDisplayVocabulary('th');
}

/**
 * 번역 페이지 표시
 */
function showTranslationPage() {
    state.currentPage = 'translation';

    const translationSection = document.getElementById('translation-section');
    const vocabularySection = document.getElementById('vocabulary-section');

    if (translationSection) translationSection.classList.remove('hidden');
    if (vocabularySection) vocabularySection.classList.add('hidden');
}

/**
 * 언어별 단어 로드 및 표시
 * @param {string} language - 언어 코드
 */
async function loadAndDisplayVocabulary(language) {
    state.currentVocabularyLanguage = language;

    const loadingIndicator = document.getElementById('vocabulary-loading');
    const tableContainer = document.getElementById('vocabulary-table-container');

    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (tableContainer) tableContainer.innerHTML = '';

    const words = await loadVocabulary(language);

    if (loadingIndicator) loadingIndicator.classList.add('hidden');
    renderVocabularyTable(words, language);

    // 언어 탭 활성화
    const langTabs = document.querySelectorAll('[data-vocab-lang]');
    langTabs.forEach(tab => {
        if (tab.getAttribute('data-vocab-lang') === language) {
            tab.classList.add('active', 'bg-blue-900/20', 'text-white', 'border-blue-500');
        } else {
            tab.classList.remove('active', 'bg-blue-900/20', 'text-white', 'border-blue-500');
        }
    });
}

