/**
 * Supabase 데이터베이스 클라이언트
 */

let supabaseClient = null;

/**
 * Supabase 클라이언트 초기화
 * @returns {Object|null} Supabase 클라이언트 또는 null
 */
function initSupabase() {
    try {
        // Supabase URL과 키를 로컬 스토리지에서 가져오기
        const supabaseUrl = localStorage.getItem(CONFIG.SUPABASE_URL_STORAGE_KEY);
        const supabaseKey = localStorage.getItem(CONFIG.SUPABASE_ANON_KEY_STORAGE_KEY);

        if (!supabaseUrl || !supabaseKey) {
            console.warn('Supabase credentials not found. Please configure in settings.');
            return null;
        }

        // Supabase 클라이언트가 이미 로드되어 있는지 확인
        if (typeof supabase === 'undefined') {
            console.error('Supabase library not loaded. Please include Supabase CDN in index.html');
            return null;
        }

        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        return supabaseClient;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return null;
    }
}

/**
 * Supabase 클라이언트 가져오기
 * @returns {Object|null} Supabase 클라이언트
 */
function getSupabaseClient() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

/**
 * Supabase 연결 테스트
 * @returns {Promise<boolean>} 연결 성공 여부
 */
async function testSupabaseConnection() {
    try {
        const client = getSupabaseClient();
        if (!client) {
            return false;
        }

        // 간단한 쿼리로 연결 테스트
        const { error } = await client.from('vocabulary').select('id').limit(1);

        if (error && error.code !== 'PGRST116') { // PGRST116은 테이블이 비어있을 때 발생
            console.error('Supabase connection test failed:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Supabase connection test error:', error);
        return false;
    }
}

