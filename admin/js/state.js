/**
 * Central State Store for UGR Admin CMS
 */

export const state = {
    user: null,
    adminRecord: null,
    activeTotpFactorId: null,
    isEvaluatingSession: false,
    currentActiveView: 'overview',
    
    // UI Mode ('simplu' | 'avansat')
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
    mediaActiveTab: 'all'
};
