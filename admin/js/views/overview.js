/**
 * Overview View (Tablou de Bord General UGR)
 */

import { updateRequestsKpi } from './requests.js';
import { updateMembersKpi } from './members.js';
import { updateNewsKpi } from './news.js';
import { pingSupabaseHealth } from './telemetry.js';

export function updateOverviewKpi() {
    updateRequestsKpi();
    updateMembersKpi();
    updateNewsKpi();
    pingSupabaseHealth();
}
