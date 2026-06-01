const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const ACTIVE_DUE_STATUSES = [
    "disetujui",
    "dipinjam",
    "terlambat",
    "menunggu_inspeksi",
];

/**
 * Hitung sisa atau keterlambatan relatif terhadap batas waktu (due_at).
 */
export function getLoanRemaining(dueAtIso) {
    if (!dueAtIso) return null;

    const due = new Date(dueAtIso);
    if (Number.isNaN(due.getTime())) return null;

    const diffMs = due.getTime() - Date.now();

    if (diffMs <= 0) {
        const overdueMs = Math.abs(diffMs);
        const overdueHours = overdueMs / HOUR_MS;

        if (overdueHours < 24) {
            return {
                overdue: true,
                value: Math.max(1, Math.ceil(overdueHours)),
                unit: "jam",
            };
        }

        return {
            overdue: true,
            value: Math.max(1, Math.ceil(overdueMs / DAY_MS)),
            unit: "hari",
        };
    }

    const remainingHours = diffMs / HOUR_MS;

    if (remainingHours < 24) {
        return {
            overdue: false,
            value: Math.max(1, Math.ceil(remainingHours)),
            unit: "jam",
        };
    }

    return {
        overdue: false,
        value: Math.max(1, Math.ceil(remainingHours / DAY_MS)),
        unit: "hari",
    };
}

export function shouldShowLoanDueCountdown(loan, isHistory) {
    if (isHistory || loan.item_type !== "alat" || !loan.due_at_iso) {
        return false;
    }

    return ACTIVE_DUE_STATUSES.includes(loan.status);
}
