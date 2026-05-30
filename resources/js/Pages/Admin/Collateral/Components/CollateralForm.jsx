import InputError from "@/Components/InputError";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";

export default function CollateralForm({
    data,
    setData,
    errors,
    processing,
    loanOptions = [],
    studentOptions = [],
    cardTypeOptions = {},
    statusOptions = {},
    isEdit = false,
}) {
    const handleLoanChange = (loanId) => {
        const loan = loanOptions.find((l) => String(l.id) === loanId);
        setData("loan_id", loanId);
        if (loan) {
            setData("student_id", String(loan.borrower_id));
            if (!data.card_number && loan.borrower_nisn) {
                setData("card_number", loan.borrower_nisn);
            }
        }
    };

    return (
        <Card className="rounded-2xl border-border/60 shadow-card">
            <CardHeader>
                <CardTitle>Data Jaminan Kartu</CardTitle>
                <CardDescription>
                    Jaminan kartu pelajar untuk peminjaman alat bawa pulang.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                {!isEdit && (
                    <>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Peminjaman Terkait *</Label>
                            <Select
                                value={data.loan_id}
                                onChange={(e) =>
                                    handleLoanChange(e.target.value)
                                }
                                disabled={processing}
                            >
                                <option value="">
                                    Pilih peminjaman bawa pulang
                                </option>
                                {loanOptions.map((loan) => (
                                    <option key={loan.id} value={loan.id}>
                                        {loan.label}
                                    </option>
                                ))}
                            </Select>
                            <InputError message={errors.loan_id} />
                        </div>

                        <div className="space-y-2">
                            <Label>Siswa *</Label>
                            <Select
                                value={data.student_id}
                                onChange={(e) =>
                                    setData("student_id", e.target.value)
                                }
                                disabled={processing}
                            >
                                <option value="">Pilih siswa</option>
                                {studentOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </Select>
                            <InputError message={errors.student_id} />
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <Label>Jenis Kartu *</Label>
                    <Select
                        value={data.card_type}
                        onChange={(e) => setData("card_type", e.target.value)}
                        disabled={processing}
                    >
                        {Object.entries(cardTypeOptions).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </Select>
                    <InputError message={errors.card_type} />
                </div>

                <div className="space-y-2">
                    <Label>Nomor Kartu / NISN</Label>
                    <Input
                        value={data.card_number ?? ""}
                        onChange={(e) =>
                            setData("card_number", e.target.value)
                        }
                        placeholder="Nomor kartu pelajar atau NISN"
                        disabled={processing}
                    />
                    <InputError message={errors.card_number} />
                </div>

                <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                        value={data.status}
                        onChange={(e) => setData("status", e.target.value)}
                        disabled={processing}
                    >
                        {Object.entries(statusOptions).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </Select>
                    <InputError message={errors.status} />
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <Label>Catatan</Label>
                    <textarea
                        rows={3}
                        value={data.notes ?? ""}
                        onChange={(e) => setData("notes", e.target.value)}
                        disabled={processing}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    />
                    <InputError message={errors.notes} />
                </div>
            </CardContent>
        </Card>
    );
}
