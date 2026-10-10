function PracticumParticipants({ submission }) {
    if (!submission?.is_praktikum) {
        return null;
    }

    const groupSize = submission.group_size ?? 1;
    const members = submission.members ?? [];
    const isGroup = groupSize > 1;

    return (
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">
                {isGroup ? "Kelompok Praktikum" : "Praktikum Individu"}
            </h2>
            <dl className="mt-4 space-y-3">
                <div>
                    <dt className="text-xs text-muted-foreground">Ketua</dt>
                    <dd className="text-sm font-medium text-foreground">
                        {submission.borrower_name || "—"}
                    </dd>
                </div>
                {isGroup ? (
                    <div>
                        <dt className="text-xs text-muted-foreground">
                            Anggota ({members.length})
                        </dt>
                        <dd>
                            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground">
                                {members.map((m) => (
                                    <li key={m.id}>{m.name}</li>
                                ))}
                            </ul>
                        </dd>
                    </div>
                ) : null}
                <div>
                    <dt className="text-xs text-muted-foreground">
                        Total Peserta
                    </dt>
                    <dd className="text-sm font-semibold text-foreground">
                        {groupSize} Orang
                    </dd>
                </div>
            </dl>
        </section>
    );
}

export default PracticumParticipants;
