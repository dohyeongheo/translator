/**
 * 단어장 기능
 */

// 저장된 단어 캐시 (word + language 조합으로 저장)
let savedWordsCache = new Map();

// 단어장 상태 관리
let vocabularyState = {
    searchTerm: '',
    selectedWordIds: [],
    currentPage: 1,
    pageSize: 20,
    isSelectAll: false,
    allWords: [], // 전체 단어 목록 (검색/필터링 전)
    filteredWords: [] // 필터링된 단어 목록
};

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
            return {
                success: false,
                action: 'save',
                error: I18N[state.uiLang]?.supabaseNotConfigured || 'Supabase가 설정되지 않았습니다. 설정에서 Supabase URL과 키를 입력해주세요.'
            };
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
            // 이미 저장된 단어는 삭제
            const { error: deleteError } = await client
                .from('vocabulary')
                .delete()
                .eq('id', existing.id);

            if (deleteError) {
                console.error('Failed to delete word:', deleteError);
                return {
                    success: false,
                    action: 'delete',
                    error: I18N[state.uiLang]?.wordDeleteFailed || '단어 삭제에 실패했습니다.'
                };
            }

            // 캐시에서 제거
            state.savedWords = state.savedWords.filter(id => id !== existing.id);
            updateSavedWordsCache(wordData.language, wordData.word, false);

            return {
                success: true,
                action: 'delete'
            };
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
            return {
                success: false,
                action: 'save',
                error: I18N[state.uiLang]?.wordSaveFailed || '단어 저장에 실패했습니다.'
            };
        }

        // 캐시에 추가
        if (data && data.id) {
            state.savedWords.push(data.id);
            updateSavedWordsCache(wordData.language, wordData.word, true);
        }

        return {
            success: true,
            action: 'save'
        };
    } catch (error) {
        console.error('Error saving word:', error);
        return {
            success: false,
            action: 'save',
            error: I18N[state.uiLang]?.wordSaveFailed || '단어 저장에 실패했습니다.'
        };
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
 * 선택된 단어들 일괄 삭제
 */
async function deleteSelectedWords(skipConfirm = false) {
    if (vocabularyState.selectedWordIds.length === 0) {
        hideDeleteConfirmModal();
        return;
    }

    if (!skipConfirm) {
        const confirmMessage = I18N[state.uiLang]?.confirmDeleteSelected || '선택한 항목을 삭제하시겠습니까?';
        if (!confirm(confirmMessage)) {
            return;
        }
    }

    const deleteBtn = document.getElementById('vocabulary-delete-selected-btn');
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.textContent = '삭제 중...';
    }

    try {
        // 선택된 ID들을 순차적으로 삭제
        const deletePromises = vocabularyState.selectedWordIds.map(id => deleteWord(id));
        await Promise.all(deletePromises);

        // 선택 상태 초기화
        vocabularyState.selectedWordIds = [];
        vocabularyState.isSelectAll = false;

        // 삭제 버튼 숨기기
        if (deleteBtn) {
            deleteBtn.classList.add('hidden');
        }

        showToast(I18N[state.uiLang]?.selectedItemsDeleted || '선택한 항목이 삭제되었습니다.');

        // 목록 새로고침
        await loadAndDisplayVocabulary(state.currentVocabularyLanguage);
    } catch (error) {
        console.error('Error deleting selected words:', error);
        showToast(I18N[state.uiLang]?.wordDeleteFailed || '단어 삭제에 실패했습니다.');
    } finally {
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.textContent = I18N[state.uiLang]?.deleteSelected || '선택 삭제';
        }

        // 모달 닫기
        hideDeleteConfirmModal();
    }
}

/**
 * 전체 선택/해제 토글
 */
function toggleSelectAll() {
    vocabularyState.isSelectAll = !vocabularyState.isSelectAll;
    vocabularyState.selectedWordIds = [];

    if (vocabularyState.isSelectAll) {
        // 현재 표시된 단어들 모두 선택
        const checkboxes = document.querySelectorAll('#vocabulary-table-container input[type="checkbox"][data-word-id]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            const wordId = checkbox.getAttribute('data-word-id');
            if (wordId && !vocabularyState.selectedWordIds.includes(wordId)) {
                vocabularyState.selectedWordIds.push(wordId);
            }
        });
    } else {
        // 모두 해제
        const checkboxes = document.querySelectorAll('#vocabulary-table-container input[type="checkbox"][data-word-id]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    updateDeleteButtonVisibility();
}

/**
 * 개별 체크박스 토글
 * @param {string} wordId - 단어 ID
 */
function toggleWordSelection(wordId) {
    const index = vocabularyState.selectedWordIds.indexOf(wordId);
    if (index > -1) {
        vocabularyState.selectedWordIds.splice(index, 1);
    } else {
        vocabularyState.selectedWordIds.push(wordId);
    }

    vocabularyState.isSelectAll = false;
    updateDeleteButtonVisibility();
}

/**
 * 선택 삭제 버튼 표시/숨김 업데이트
 */
function updateDeleteButtonVisibility() {
    const deleteBtn = document.getElementById('vocabulary-delete-selected-btn');
    if (deleteBtn) {
        if (vocabularyState.selectedWordIds.length > 0) {
            deleteBtn.classList.remove('hidden');
        } else {
            deleteBtn.classList.add('hidden');
        }
    }
}

// 삭제 확인 모달 표시
function showDeleteConfirmModal() {
    if (vocabularyState.selectedWordIds.length === 0) return;
    const modal = document.getElementById('delete-confirm-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// 삭제 확인 모달 숨김
function hideDeleteConfirmModal() {
    const modal = document.getElementById('delete-confirm-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
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
 * 단어 검색 필터링
 * @param {Array} words - 단어 목록
 * @param {string} searchTerm - 검색어
 * @returns {Array} 필터링된 단어 목록
 */
function filterVocabulary(words, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        return words;
    }

    const term = searchTerm.toLowerCase().trim();
    return words.filter(word => {
        const wordText = (word.word || '').toLowerCase();
        const meaningText = (word.meaning || '').toLowerCase();
        const pronunciationText = (word.pronunciation || '').toLowerCase();

        return wordText.includes(term) ||
               meaningText.includes(term) ||
               pronunciationText.includes(term);
    });
}

/**
 * 단어 목록 페이지네이션
 * @param {Array} words - 단어 목록
 * @param {number} page - 현재 페이지 (1부터 시작)
 * @param {number} pageSize - 페이지당 항목 수
 * @returns {Object} { paginatedWords, totalPages, currentPage }
 */
function paginateWords(words, page, pageSize) {
    const totalPages = Math.ceil(words.length / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedWords = words.slice(startIndex, endIndex);

    return {
        paginatedWords,
        totalPages,
        currentPage
    };
}

/**
 * 페이지네이션 UI 렌더링
 * @param {number} totalPages - 전체 페이지 수
 * @param {number} currentPage - 현재 페이지
 */
function renderPagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('vocabulary-pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalPages <= 1) {
        return; // 페이지가 1개 이하면 페이지네이션 숨김
    }

    // 이전 버튼
    const prevButton = document.createElement('button');
    prevButton.className = `px-3 py-2 rounded-lg text-sm font-bold transition ${
        currentPage === 1
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gray-700 text-white hover:bg-gray-600'
    }`;
    prevButton.textContent = I18N[state.uiLang]?.previous || '이전';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            vocabularyState.currentPage = currentPage - 1;
            applyFiltersAndRender();
        }
    });
    paginationContainer.appendChild(prevButton);

    // 페이지 번호 버튼
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.className = 'px-3 py-2 rounded-lg text-sm font-bold transition bg-gray-700 text-white hover:bg-gray-600';
        firstButton.textContent = '1';
        firstButton.addEventListener('click', () => {
            vocabularyState.currentPage = 1;
            applyFiltersAndRender();
        });
        paginationContainer.appendChild(firstButton);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'px-2 text-gray-400';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `px-3 py-2 rounded-lg text-sm font-bold transition ${
            i === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
        }`;
        pageButton.textContent = i.toString();
        pageButton.addEventListener('click', () => {
            vocabularyState.currentPage = i;
            applyFiltersAndRender();
        });
        paginationContainer.appendChild(pageButton);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'px-2 text-gray-400';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }

        const lastButton = document.createElement('button');
        lastButton.className = 'px-3 py-2 rounded-lg text-sm font-bold transition bg-gray-700 text-white hover:bg-gray-600';
        lastButton.textContent = totalPages.toString();
        lastButton.addEventListener('click', () => {
            vocabularyState.currentPage = totalPages;
            applyFiltersAndRender();
        });
        paginationContainer.appendChild(lastButton);
    }

    // 다음 버튼
    const nextButton = document.createElement('button');
    nextButton.className = `px-3 py-2 rounded-lg text-sm font-bold transition ${
        currentPage === totalPages
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gray-700 text-white hover:bg-gray-600'
    }`;
    nextButton.textContent = I18N[state.uiLang]?.next || '다음';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            vocabularyState.currentPage = currentPage + 1;
            applyFiltersAndRender();
        }
    });
    paginationContainer.appendChild(nextButton);
}

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
        emptyMessage.className = 'text-center py-8';
        emptyMessage.style.color = 'var(--text-tertiary)';
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
    thead.style.background = 'var(--bg-card)';
    const headerRow = document.createElement('tr');

    // 체크박스 헤더
    const checkboxHeader = document.createElement('th');
    checkboxHeader.className = 'px-4 py-3 text-center w-12';
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.checked = vocabularyState.isSelectAll;
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
    checkboxHeader.appendChild(selectAllCheckbox);
    headerRow.appendChild(checkboxHeader);

    // 원문 헤더
    const wordHeader = document.createElement('th');
    wordHeader.className = 'px-4 py-3 text-left cursor-pointer';
    wordHeader.style.color = 'var(--text-primary)';
    wordHeader.setAttribute('data-sort', 'word');
    wordHeader.innerHTML = `${I18N[state.uiLang]?.original || '원문'} <i class="fas fa-sort text-xs ml-1"></i>`;
    wordHeader.onmouseover = function() { this.style.background = 'var(--bg-card-hover)'; };
    wordHeader.onmouseout = function() { this.style.background = 'transparent'; };
    headerRow.appendChild(wordHeader);

    // 발음 헤더
    const pronunciationHeader = document.createElement('th');
    pronunciationHeader.className = 'px-4 py-3 text-left cursor-pointer';
    pronunciationHeader.style.color = 'var(--text-primary)';
    pronunciationHeader.setAttribute('data-sort', 'pronunciation');
    pronunciationHeader.innerHTML = `${I18N[state.uiLang]?.pronunciation || '발음'} <i class="fas fa-sort text-xs ml-1"></i>`;
    pronunciationHeader.onmouseover = function() { this.style.background = 'var(--bg-card-hover)'; };
    pronunciationHeader.onmouseout = function() { this.style.background = 'transparent'; };
    headerRow.appendChild(pronunciationHeader);

    // 의미 헤더
    const meaningHeader = document.createElement('th');
    meaningHeader.className = 'px-4 py-3 text-left cursor-pointer';
    meaningHeader.style.color = 'var(--text-primary)';
    meaningHeader.setAttribute('data-sort', 'meaning');
    meaningHeader.innerHTML = `${I18N[state.uiLang]?.meaning || '의미'} <i class="fas fa-sort text-xs ml-1"></i>`;
    meaningHeader.onmouseover = function() { this.style.background = 'var(--bg-card-hover)'; };
    meaningHeader.onmouseout = function() { this.style.background = 'transparent'; };
    headerRow.appendChild(meaningHeader);

    // 저장 날짜 헤더
    const dateHeader = document.createElement('th');
    dateHeader.className = 'px-4 py-3 text-left cursor-pointer';
    dateHeader.style.color = 'var(--text-primary)';
    dateHeader.setAttribute('data-sort', 'created_at');
    dateHeader.innerHTML = `${I18N[state.uiLang]?.savedDate || '저장 날짜'} <i class="fas fa-sort text-xs ml-1"></i>`;
    dateHeader.onmouseover = function() { this.style.background = 'var(--bg-card-hover)'; };
    dateHeader.onmouseout = function() { this.style.background = 'transparent'; };
    headerRow.appendChild(dateHeader);

    // 액션 헤더 제거 (삭제 컬럼 제거)

    thead.appendChild(headerRow);

    // 테이블 바디
    const tbody = document.createElement('tbody');
    sortedWords.forEach(word => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border-color)';
        row.onmouseover = function() { this.style.background = 'var(--bg-card-hover)'; };
        row.onmouseout = function() { this.style.background = 'transparent'; };

        const date = new Date(word.created_at);
        const dateStr = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        // 체크박스 셀
        const checkboxCell = document.createElement('td');
        checkboxCell.className = 'px-4 py-3 text-center';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.setAttribute('data-word-id', word.id);
        checkbox.checked = vocabularyState.selectedWordIds.includes(word.id);
        checkbox.addEventListener('change', () => toggleWordSelection(word.id));
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        // 원문 셀 (TTS 버튼 포함)
        const wordCell = document.createElement('td');
        wordCell.className = 'px-4 py-3';
        const wordContainer = document.createElement('div');
        wordContainer.className = 'flex items-center gap-2';
        const wordText = document.createElement('span');
        wordText.className = 'font-medium';
        wordText.textContent = word.word || '';
        wordContainer.appendChild(wordText);

        // TTS 버튼
        const ttsButton = document.createElement('button');
        ttsButton.className = 'transition';
        ttsButton.style.color = 'var(--accent-primary)';
        ttsButton.setAttribute('aria-label', I18N[state.uiLang]?.ttsPlay || '음성 재생');
        ttsButton.setAttribute('title', I18N[state.uiLang]?.ttsPlay || '음성 재생');
        ttsButton.onmouseover = function() { this.style.color = 'var(--accent-hover)'; };
        ttsButton.onmouseout = function() { this.style.color = 'var(--accent-primary)'; };
        const ttsIcon = document.createElement('i');
        ttsIcon.className = 'fas fa-volume-high text-xs';
        ttsButton.appendChild(ttsIcon);
        ttsButton.addEventListener('click', () => {
            if (typeof playTTS === 'function') {
                playTTS(word.word, language);
            }
        });
        wordContainer.appendChild(ttsButton);
        wordCell.appendChild(wordContainer);
        row.appendChild(wordCell);

        // 발음 셀
        const pronunciationCell = document.createElement('td');
        pronunciationCell.className = 'px-4 py-3';
        pronunciationCell.style.color = 'var(--accent-primary)';
        pronunciationCell.textContent = word.pronunciation || '-';
        row.appendChild(pronunciationCell);

        // 의미 셀
        const meaningCell = document.createElement('td');
        meaningCell.className = 'px-4 py-3';
        meaningCell.textContent = word.meaning || '';
        row.appendChild(meaningCell);

        // 날짜 셀
        const dateCell = document.createElement('td');
        dateCell.className = 'px-4 py-3 text-xs';
        dateCell.style.color = 'var(--text-tertiary)';
        dateCell.textContent = dateStr;
        row.appendChild(dateCell);

        // 삭제 셀 제거

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

            // 필터링 및 렌더링 적용
            applyFiltersAndRender();
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
    const realtimeSection = document.getElementById('realtime-section');
    const vocabularySection = document.getElementById('vocabulary-section');

    if (translationSection) translationSection.classList.add('hidden');
    if (realtimeSection) realtimeSection.classList.add('hidden');
    if (vocabularySection) vocabularySection.classList.remove('hidden');

    // 검색 이벤트 리스너 초기화
    initVocabularySearch();

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
    const realtimeSection = document.getElementById('realtime-section');
    const vocabularySection = document.getElementById('vocabulary-section');

    if (translationSection) translationSection.classList.remove('hidden');
    if (realtimeSection) realtimeSection.classList.add('hidden');
    if (vocabularySection) vocabularySection.classList.add('hidden');
}

/**
 * 실시간 번역 페이지 표시
 */
function showRealtimePage() {
    state.currentPage = 'realtime';

    const translationSection = document.getElementById('translation-section');
    const realtimeSection = document.getElementById('realtime-section');
    const vocabularySection = document.getElementById('vocabulary-section');

    if (translationSection) translationSection.classList.add('hidden');
    if (realtimeSection) realtimeSection.classList.remove('hidden');
    if (vocabularySection) vocabularySection.classList.add('hidden');
}

/**
 * 검색 이벤트 리스너 초기화
 */
function initVocabularySearch() {
    const searchInput = document.getElementById('vocabulary-search-input');
    if (!searchInput) return;

    // 기존 이벤트 리스너 제거를 위해 클론
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);

    // 검색 입력 이벤트 (디바운싱)
    let searchTimeout = null;
    newInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            vocabularyState.searchTerm = e.target.value;
            vocabularyState.currentPage = 1; // 검색 시 첫 페이지로
            applyFiltersAndRender();
        }, 300);
    });

    // Enter 키 이벤트
    newInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            vocabularyState.searchTerm = e.target.value;
            vocabularyState.currentPage = 1;
            applyFiltersAndRender();
        }
    });
}

/**
 * 필터링 및 렌더링 적용
 */
function applyFiltersAndRender() {
    const language = state.currentVocabularyLanguage;

    // 검색 필터링
    vocabularyState.filteredWords = filterVocabulary(vocabularyState.allWords, vocabularyState.searchTerm);

    // 정렬 적용
    let sortedWords = [...vocabularyState.filteredWords];
    if (vocabularySortState.column) {
        sortedWords = sortWords([...vocabularyState.filteredWords], vocabularySortState.column, vocabularySortState.order);
    }

    // 페이지네이션 적용
    const { paginatedWords, totalPages, currentPage } = paginateWords(sortedWords, vocabularyState.currentPage, vocabularyState.pageSize);
    vocabularyState.currentPage = currentPage;

    // 테이블 렌더링
    renderVocabularyTable(paginatedWords, language);

    // 페이지네이션 렌더링
    renderPagination(totalPages, currentPage);

    // 선택 삭제 버튼 업데이트
    updateDeleteButtonVisibility();
}

/**
 * 언어별 단어 로드 및 표시
 * @param {string} language - 언어 코드
 */
async function loadAndDisplayVocabulary(language) {
    state.currentVocabularyLanguage = language;

    // 상태 초기화
    vocabularyState.searchTerm = '';
    vocabularyState.selectedWordIds = [];
    vocabularyState.currentPage = 1;
    vocabularyState.isSelectAll = false;

    const loadingIndicator = document.getElementById('vocabulary-loading');
    const tableContainer = document.getElementById('vocabulary-table-container');
    const searchInput = document.getElementById('vocabulary-search-input');

    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (tableContainer) tableContainer.innerHTML = '';
    if (searchInput) searchInput.value = '';

    const words = await loadVocabulary(language);

    // 전체 단어 목록 저장
    vocabularyState.allWords = words;

    if (loadingIndicator) loadingIndicator.classList.add('hidden');

    // 필터링 및 렌더링 적용
    applyFiltersAndRender();

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

