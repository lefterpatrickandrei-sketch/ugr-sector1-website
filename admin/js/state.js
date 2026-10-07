/**
 * Central State Store for UGR Admin CMS
 *
 * T-J3 (3.5): starea e acum produsă de `createInitialState()`, o funcție.
 * E nevoie de ea pentru două motive:
 *  1. boot: `state` pornește din starea inițială, mereu identică;
 *  2. logout: `handleSignOut()` face `Object.assign(state, createInitialState())`
 *     → se curăță TOATE colecțiile, filtrele, paginarea, selecțiile bulk și
 *     referințele la canale. Înainte se resetau doar requests/members/news,
 *     iar un admin nou care intra pe același browser vedea datele vechi.
 *
 * Contract important: niciun modul nu trebuie să rețină o referință lungă de
 * tip `const s = state.selectedMemberIds` (vezi T-J3), pentru că obiectele Set
 * sunt înlocuite, nu golite. Accesul se face întotdeauna prin `state.*`.
 */

export function createInitialState() {
    return {
        user: null,
        adminRecord: null,
        activeTotpFactorId: null,
        isEvaluatingSession: false,
        currentActiveView: 'overview',

        // UI Mode ('simplu' | 'avansat') — supraviețuiește logout-ului
        uiMode: localStorage.getItem('ugr_ui_mode') || 'simplu',

        // Data collections
        allRequestsData: [],
        allMembersData: [],
        allNewsData: [],
        telemetryVisitsData: [],
        allSettingsData: {},
        allLeadershipData: [],
        allFaqData: [],
        allDocumentsData: [],

        // Bulk selections
        selectedRequestIds: new Set(),
        selectedMemberIds: new Set(),
        selectedNewsIds: new Set(),
        selectedLeadershipIds: new Set(),
        selectedFaqIds: new Set(),
        selectedDocumentIds: new Set(),

        // Pagination & filters
        requestsPage: 1,
        requestsLimit: 10,
        requestsFilterStatus: 'toate',
        requestsSearchQuery: '',

        membersPage: 1,
        membersLimit: 10,
        membersFilterCounty: 'all',
        membersFilterCategory: 'all',
        membersFilterStatus: 'all',
        membersSearchQuery: '',

        newsPage: 1,
        newsLimit: 10,
        newsFilterStatus: 'all',
        newsSearchQuery: '',
        newsViewMode: 'grid', // 'grid' or 'table'

        leadershipFilterGroup: 'toate', // 'toate' | 'filiala' | 'central'
        leadershipSearchQuery: '',

        faqFilterCategory: 'toate',
        faqSearchQuery: '',

        documentsFilterType: 'toate',
        documentsSearchQuery: '',

        // Telemetry range
        currentTelemetryRange: '7d',

        // Realtime Channels
        adminPresenceChannel: null,
        realtimeRequestsChannel: null,

        // P5 State: Roles, Trash & Storage
        allAdminsData: [],
        allTrashData: [],
        trashFilterType: 'toate',
        trashSearchQuery: '',
        remoteMediaAssets: [],
        mediaActiveTab: 'all',

        // Pages View State
        pagesActiveTab: 'acasa',
        pagesData: {},
        pagesDirty: false
    };
}

export const state = createInitialState();

/**
 * T-J3 (3.5): resetează integral starea în memorie, păstrând `uiMode`
 * (reluat din localStorage de `createInitialState`).
 */
export function resetState() {
    const preservedUiMode = state.uiMode;
    Object.assign(state, createInitialState());
    state.uiMode = preservedUiMode;
    return state;
}