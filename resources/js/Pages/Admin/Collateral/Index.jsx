import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import DataPagination from "@/Components/DataPagination";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { CreditCard, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CollateralTable from "./Components/CollateralTable";
import DeleteCollateralDialog from "./Components/DeleteCollateralDialog";
import InspectReturnDialog from "./Components/InspectReturnDialog";

export default function Index({
    collaterals,
    filters,
    studentOptions,
    kelasOptions,
    statusOptions,
}) {
    const { data, setData } = useForm({
        search: filters.search ?? "",
        status: filters.status ?? "all",
        student_id: filters.student_id ?? "all",
        kelas: filters.kelas ?? "all",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [inspectTarget, setInspectTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [inspecting, setInspecting] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeout = setTimeout(() => {
            router.get(route("admin.collaterals.index"), data, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);
        return () => clearTimeout(timeout);
    }, [
        data.search,
        data.status,
        data.student_id,
        data.kelas,
        data.date_from,
        data.date_to,
    ]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route("admin.collaterals.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const handleInspect = (payload) => {
        if (!inspectTarget) return;
        setInspecting(true);
        router.post(route("admin.loans.inspect", inspectTarget.loan_id), payload, {
            onFinish: () => {
                setInspecting(false);
                setInspectTarget(null);
            },
        });
    };

    const list = collaterals.data ?? [];

    return (
        <AppLayout>
            <Head title="Jaminan Kartu" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Jaminan Kartu"
                    subtitle={`${collaterals.meta?.total ?? 0} jaminan terdaftar`}
                >
                    <Button asChild>
                        <Link href={route("admin.collaterals.create")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Jaminan
                        </Link>
                    </Button>
                </PageHeader>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative sm:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                            placeholder="Cari kode, siswa, peminjaman..."
                            className="rounded-xl border-border/60 bg-card pl-10 shadow-sm"
                        />
                    </div>
                    <Select
                        value={data.status}
                        onChange={(e) => setData("status", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua status</option>
                        {Object.entries(statusOptions).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </Select>
                    <Select
                        value={data.kelas}
                        onChange={(e) => setData("kelas", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua kelas</option>
                        {kelasOptions.map((k) => (
                            <option key={k} value={k}>
                                {k}
                            </option>
                        ))}
                    </Select>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                    <Select
                        value={data.student_id}
                        onChange={(e) =>
                            setData("student_id", e.target.value)
                        }
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua siswa</option>
                        {studentOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.label}
                            </option>
                        ))}
                    </Select>
                    <Input
                        type="date"
                        value={data.date_from}
                        onChange={(e) => setData("date_from", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    />
                    <Input
                        type="date"
                        value={data.date_to}
                        onChange={(e) => setData("date_to", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    />
                </div>

                {list.length > 0 ? (
                    <>
                        <CollateralTable
                            items={list}
                            onDelete={setDeleteTarget}
                            onInspect={setInspectTarget}
                        />
                        <DataPagination
                            links={collaterals.links}
                            meta={collaterals.meta}
                        />
                    </>
                ) : (
                    <EmptyState
                        icon={CreditCard}
                        title="Tidak ada jaminan kartu"
                        description="Belum ada kartu dititipkan atau ubah filter pencarian."
                        action={
                            <Button asChild variant="outline">
                                <Link href={route("admin.collaterals.create")}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah jaminan
                                </Link>
                            </Button>
                        }
                    />
                )}
            </div>

            <DeleteCollateralDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                itemName={deleteTarget?.code}
                onConfirm={handleDelete}
                loading={deleting}
            />
            <InspectReturnDialog
                open={!!inspectTarget}
                onOpenChange={(open) => !open && setInspectTarget(null)}
                loanCode={inspectTarget?.loan_code}
                onConfirm={handleInspect}
                loading={inspecting}
            />
        </AppLayout>
    );
}
