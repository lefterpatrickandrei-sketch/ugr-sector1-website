import fs from 'fs';
import path from 'path';

// Inventory of 93 functions and where they are found
const expectedFunctions = [
    'showToast', 'setBannerFeedback', 'clearBannerFeedback', 'showAuthStep', 'showCmsDashboard',
    'switchView', 'getPanelRedirectUrl', 'formatStatusLabel', 'formatDateTimeRo', 'formatDateOnlyRo',
    'isValidImageUrl', 'exportArrayToCsv', 'exportMembersToCsv', 'exportRequestsToCsv', 'handleSendOtp',
    'startTotpEnrollment', 'handleVerifyEnroll', 'handleVerifyTotp', 'verifyAdminStatus', 'evaluateAuthState',
    'handleSignOut', 'loadRequests', 'updateRequestsKpi', 'renderPaginationControls', 'updateBulkActionsBar',
    'clearAllBulkSelections', 'handleBulkExportMembers', 'handleBulkExportRequests', 'handleBulkDeleteMembers',
    'handleBulkApproveRequests', 'handleBulkRejectRequests', 'handleBulkDeleteNews', 'openMediaPickerModal',
    'closeMediaPickerModal', 'renderMediaPickerGrid', 'selectMediaAsset', 'updateNewsImageLivePreview',
    'applyFormatting', 'updateReadingStats', 'openCommandPalette', 'closeCommandPalette',
    'updateCommandPaletteHighlight', 'renderCommandPaletteResults', 'appendGroup', 'openAdminProfileModal',
    'closeAdminProfileModal', 'handleUpdatePassword', 'renderRequestsWithPagination',
    'renderMembersWithPagination', 'renderNewsWithPagination', 'applyRequestsFilter', 'renderRequestsList',
    'addCell', 'handleSaveNotes', 'handleSetRequestStatus', 'handleDeleteRequest',
    'initRealtimeRequestsListener', 'loadMembers', 'updateMembersKpi', 'applyMembersFilter',
    'renderMembersTable', 'openAddMemberModal', 'openEditMemberModal', 'closeMemberModal', 'handleSaveMember',
    'handleToggleMemberVisibility', 'handleDeleteMember', 'handleSyncDefaultNews', 'loadNews', 'updateNewsKpi',
    'applyNewsFilter', 'renderNews', 'renderNewsEmptyState', 'renderNewsGrid', 'renderNewsTable',
    'openAddNewsModal', 'openEditNewsModal', 'closeNewsModal', 'openPreviewNewsModal', 'closePreviewNewsModal',
    'handleSaveNews', 'handleToggleNewsPublish', 'handleDeleteNews', 'pingSupabaseHealth', 'loadVisitsStats',
    'loadTelemetryData', 'renderTrafficChart', 'renderTelemetryBreakdowns', 'populateCard',
    'buildAuditTrailEvents', 'renderAuditTrail', 'initAdminLivePresence', 'updateCharCounters'
];

console.log(`Checking coverage for all ${expectedFunctions.length} inventory functions...`);

const jsDir = 'admin/js';
function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(full));
        } else if (file.endsWith('.js')) {
            results.push(full);
        }
    });
    return results;
}

const allJsFiles = getFiles(jsDir);
console.log(`Found ${allJsFiles.length} JavaScript files in admin/js/`);

const foundFunctions = new Set();
const fileContentMap = {};

allJsFiles.forEach(f => {
    fileContentMap[f] = fs.readFileSync(f, 'utf8');
});

expectedFunctions.forEach(fn => {
    let foundIn = [];
    allJsFiles.forEach(f => {
        const content = fileContentMap[f];
        // match function fn( or export function fn( or export const fn = or fn =
        const regex = new RegExp(`(function\\s+${fn}\\b|const\\s+${fn}\\s*=|let\\s+${fn}\\s*=|export\\s+function\\s+${fn}\\b)`, 'g');
        if (regex.test(content)) {
            foundIn.push(f);
        }
    });
    if (foundIn.length > 0) {
        foundFunctions.add(fn);
        // console.log(`[OK] ${fn} found in: ${foundIn.join(', ')}`);
    } else {
        console.error(`[MISSING] ${fn} NOT found in any module!`);
    }
});

console.log(`\nCoverage Result: ${foundFunctions.size} / ${expectedFunctions.length} functions present in modular JS.`);

if (foundFunctions.size === expectedFunctions.length) {
    console.log('SUCCESS: 100% Function Coverage (93/93)!');
} else {
    process.exit(1);
}
