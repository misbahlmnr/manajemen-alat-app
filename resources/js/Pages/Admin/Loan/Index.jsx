import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import FilterToolbar from "@/Components/FilterToolbar";
import { paginatorTotal } from "@/lib/paginator";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, router, useForm } from "@inertiajs/react";
import { ClipboardList, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import LoanTable from "./Components/LoanTable";

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

    const list = loans.data ?? [];
    const total = paginatorTotal(loans);

    return (
        <AppLayout>
            <Head title="Peminjaman" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Peminjaman"
                    subtitle="Verifikasi dan pantau pengajuan alat & bahan siswa"
                />

                <FilterToolbar
                    title="Filter pengajuan"
                    description="Cari kode, peminjam, atau sempitkan berdasarkan guru dan tanggal"
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="relative sm:col-span-2">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={data.search}
                                onChange={(e) =>
                                    setData("search", e.target.value)
                                }
                                placeholder="Cari SUB-0004, peminjam, barang..."
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={data.status}
                            onChange={(e) => setData("status", e.target.value)}
                        >
                            <option value="all">Semua status</option>
                            {Object.entries(statusOptions).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </Select>
                        <Select
                            value={data.item_type}
                            onChange={(e) =>
                                setData("item_type", e.target.value)
                            }
                        >
                            <option value="all">Semua jenis</option>
                            <option value="alat">Alat</option>
                            <option value="bahan">Bahan</option>
                        </Select>
                        <Select
                            value={data.borrower_id}
                            onChange={(e) =>
                                setData("borrower_id", e.target.value)
                            }
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
                            />
                            <Input
                                type="date"
                                value={data.date_to}
                                onChange={(e) =>
                                    setData("date_to", e.target.value)
                                }
                            />
                        </div>
                    </div>
                </FilterToolbar>

                {total > 0 ? (
                    <LoanTable items={list} pagination={loans} />
                ) : (
                    <EmptyState
                        icon={ClipboardList}
                        title="Tidak ada pengajuan ditemukan"
                        description="Pengajuan alat dan bahan dari siswa tampil sebagai satu baris di sini."
                    />
                )}
            </div>
        </AppLayout>
    );
}
