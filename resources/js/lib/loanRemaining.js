const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const ACTIVE_DUE_STATUSES = [
    "disetujui",
    "dipinjam",
    "terlambat",
    "menunggu_inspeksi",
];

function durationBucket(absMs) {
    if (absMs < HOUR_MS) {
        const minutes = Math.max(1, Math.ceil(absMs / MINUTE_MS));

        return minutes >= 60
            ? { value: 1, unit: "jam" }
            : { value: minutes, unit: "menit" };
    }

    if (absMs < DAY_MS) {
        return {
            value: Math.max(1, Math.ceil(absMs / HOUR_MS)),
            unit: "jam",
        };
    }

    return {
        value: Math.max(1, Math.ceil(absMs / DAY_MS)),
        unit: "hari",
    };
}

/**
 * Hitung sisa atau keterlambatan relatif terhadap batas waktu (due_at).
 */
export function getLoanRemaining(dueAtIso, nowMs = Date.now()) {
    if (!dueAtIso) return null;

    const due = new Date(dueAtIso);
    if (Number.isNaN(due.getTime())) return null;

    const diffMs = due.getTime() - nowMs;
    const bucket = durationBucket(Math.abs(diffMs) || 1);

    return {
        overdue: diffMs <= 0,
        ...bucket,
    };
}

export function isLoanDueUrgent(remaining) {
    if (!remaining || remaining.overdue) {
        return false;
    }

    if (remaining.unit === "menit") {
        return true;
    }

    return remaining.unit === "jam" && remaining.value <= 2;
}

export function shouldShowLoanDueCountdown(loan, isHistory) {
    if (isHistory || loan.item_type !== "alat" || !loan.due_at_iso) {
        return false;
    }

    return ACTIVE_DUE_STATUSES.includes(loan.status);
}
