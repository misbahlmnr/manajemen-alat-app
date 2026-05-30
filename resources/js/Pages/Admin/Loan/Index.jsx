import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import DataPagination from "@/Components/DataPagination";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { ClipboardList, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LoanTable from "./Components/LoanTable";
import DeleteLoanDialog from "./Components/DeleteLoanDialog";
import RejectLoanDialog from "./Components/RejectLoanDialog";
import ReturnLoanDialog from "./Components/ReturnLoanDialog";

export default function Index({
    loans,
    filters,
    borrowerOptions,
    supervisorOptions,
    kelasOptions,
    statusOptions,
}) {
    const { data, setData } = useForm({
        search: filters.search ?? "",
        status: filters.status ?? "all",
        item_type: filters.item_type ?? "all",
        borrower_id: filters.borrower_id ?? "all",
        supervisor_id: filters.supervisor_id ?? "all",
        kelas: filters.kelas ?? "all",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [returnTarget, setReturnTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [returning, setReturning] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeout = setTimeout(() => {
            router.get(route("admin.loans.index"), data, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);
        return () => clearTimeout(timeout);
    }, [
        data.search,
        data.status,
        data.item_type,
        data.borrower_id,
        data.supervisor_id,
        data.kelas,
        data.date_from,
        data.date_to,
    ]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route("admin.loans.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const handleReject = (reason) => {
        if (!rejectTarget) return;
        setRejecting(true);
        router.post(
            route("admin.loans.reject", rejectTarget.id),
            { rejection_reason: reason },
            {
                preserveScroll: true,
                onFinish: () => {
                    setRejecting(false);
                    setRejectTarget(null);
                },
            },
        );
    };

    const handleReturn = (note) => {
        if (!returnTarget) return;
        setReturning(true);
        router.post(
            route("admin.loans.return", returnTarget.id),
            { note: note ?? "" },
            {
                preserveScroll: true,
                onFinish: () => {
                    setReturning(false);
                    setReturnTarget(null);
                },
            },
        );
    };

    const list = loans.data ?? [];

    return (
        <AppLayout>
            <Head title="Peminjaman" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Peminjaman"
                    subtitle={`${loans.meta?.total ?? 0} pengajuan terdaftar`}
                >
                    <Button asChild>
                        <Link href={route("admin.loans.create")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Peminjaman
                        </Link>
                    </Button>
                </PageHeader>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative sm:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                            placeholder="Cari kode, peminjam, barang..."
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
                        value={data.item_type}
                        onChange={(e) => setData("item_type", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua jenis</option>
                        <option value="alat">Alat</option>
                        <option value="bahan">Bahan</option>
                    </Select>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Select
                        value={data.borrower_id}
                        onChange={(e) =>
                            setData("borrower_id", e.target.value)
                        }
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua peminjam</option>
                        {borrowerOptions.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.label}
                            </option>
                        ))}
                    </Select>
                    <Select
                        value={data.supervisor_id}
                        onChange={(e) =>
                            setData("supervisor_id", e.target.value)
                        }
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua guru</option>
                        {supervisorOptions.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.name}
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
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="date"
                            value={data.date_from}
                            onChange={(e) =>
                                setData("date_from", e.target.value)
                            }
                            className="rounded-xl border-border/60 bg-card shadow-sm"
                        />
                        <Input
                            type="date"
                            value={data.date_to}
                            onChange={(e) => setData("date_to", e.target.value)}
                            className="rounded-xl border-border/60 bg-card shadow-sm"
                        />
                    </div>
                </div>

                {list.length > 0 ? (
                    <>
                        <LoanTable
                            items={list}
                            onDelete={setDeleteTarget}
                            onReject={setRejectTarget}
                            onReturn={setReturnTarget}
                        />
                        <DataPagination
                            links={loans.links}
                            meta={loans.meta}
                        />
                    </>
                ) : (
                    <EmptyState
                        icon={ClipboardList}
                        title="Tidak ada peminjaman ditemukan"
                        description="Ubah filter atau buat pengajuan baru."
                        action={
                            <Button asChild variant="outline">
                                <Link href={route("admin.loans.create")}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah peminjaman
                                </Link>
                            </Button>
                        }
                    />
                )}
            </div>

            <DeleteLoanDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                itemName={deleteTarget?.code}
                onConfirm={handleDelete}
                loading={deleting}
            />
            <RejectLoanDialog
                open={!!rejectTarget}
                onOpenChange={(open) => !open && setRejectTarget(null)}
                itemName={rejectTarget?.code}
                onConfirm={handleReject}
                loading={rejecting}
            />
            <ReturnLoanDialog
                open={!!returnTarget}
                onOpenChange={(open) => !open && setReturnTarget(null)}
                itemName={returnTarget?.code}
                onConfirm={handleReturn}
                loading={returning}
            />
        </AppLayout>
    );
}
