/**
 * Central State Store for UGR Admin CMS
 */

export const state = {
    user: null,
    adminRecord: null,
    activeTotpFactorId: null,
    isEvaluatingSession: false,
    currentActiveView: 'overview',
    
    // Data collections
    allRequestsData: [],
    allMembersData: [],
    allNewsData: [],
    telemetryVisitsData: [],
    
    // Bulk selections
    selectedRequestIds: new Set(),
    selectedMemberIds: new Set(),
    selectedNewsIds: new Set(),
    
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
    
    // Telemetry range
    currentTelemetryRange: '7d',
    
    // Realtime Channels
    adminPresenceChannel: null,
    realtimeRequestsChannel: null
};
