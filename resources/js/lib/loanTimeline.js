/**
 * Build progress steps for StatusTimeline from loan status / collateral.
 * UI-only helper — does not change workflow.
 */
const ALAT_STEPS = [
    { key: "diminta", label: "Pengajuan" },
    { key: "disetujui", label: "Disetujui" },
    { key: "kartu", label: "Kartu diterima", optional: true },
    { key: "dipinjam", label: "Dipinjam" },
    { key: "dikembalikan", label: "Dikembalikan" },
    { key: "selesai", label: "Selesai" },
];

const BAHAN_STEPS = [
    { key: "diminta", label: "Pengajuan" },
    { key: "disetujui", label: "Disetujui" },
    { key: "dipinjam", label: "Diambil" },
    { key: "dikembalikan", label: "Selesai" },
];

const STATUS_RANK = {
    diminta: 0,
    antrian: 0,
    ditolak: -1,
    dibatalkan: -1,
    disetujui: 1,
    dipinjam: 3,
    terlambat: 3,
    menunggu_inspeksi: 3.5,
    dikembalikan: 4,
    selesai: 5,
};

export function buildLoanProgressSteps(loan = {}) {
    const isBahan = loan.item_type === "bahan" || loan.itemType === "bahan";
    const status = loan.status ?? "diminta";
    const requiresCollateral = Boolean(loan.requires_collateral);
    const collateralHeld = ["ditahan", "dikembalikan"].includes(
        loan.collateral_status,
    );
    const collateralReturned = loan.collateral_status === "dikembalikan";

    let steps = (isBahan ? BAHAN_STEPS : ALAT_STEPS).filter((step) => {
        if (step.key === "kartu") return requiresCollateral;
        return true;
    });

    if (status === "ditolak" || status === "dibatalkan") {
        return [
            {
                key: "diminta",
                label: "Pengajuan",
                done: true,
            },
            {
                key: status,
                label: status === "ditolak" ? "Ditolak" : "Dibatalkan",
                current: true,
                done: false,
                description: loan.rejection_reason || undefined,
            },
        ];
    }

    const rank = STATUS_RANK[status] ?? 0;

    return steps.map((step) => {
        let done = false;
        let current = false;

        if (step.key === "diminta") {
            done = rank >= 0;
            current = status === "diminta" || status === "antrian";
        } else if (step.key === "disetujui") {
            done = rank >= 1;
            current = status === "disetujui" && !collateralHeld;
        } else if (step.key === "kartu") {
            done = collateralHeld;
            current = status === "disetujui" && !collateralHeld;
        } else if (step.key === "dipinjam") {
            done = rank >= 3;
            current =
                status === "dipinjam" ||
                status === "terlambat" ||
                status === "menunggu_inspeksi";
        } else if (step.key === "dikembalikan") {
            if (isBahan) {
                done = status === "dikembalikan";
                current = status === "dikembalikan";
            } else {
                done = rank >= 4;
                current = status === "dikembalikan" && !collateralReturned;
            }
        } else if (step.key === "selesai") {
            done =
                status === "dikembalikan" &&
                (!requiresCollateral || collateralReturned);
            current = done;
        }

        return {
            key: step.key,
            label: step.label,
            done: done && !current,
            current,
        };
    });
}
