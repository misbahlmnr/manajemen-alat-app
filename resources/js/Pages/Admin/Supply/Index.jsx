import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import { paginatorTotal } from "@/lib/paginator";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Package, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SupplyTable from "./Components/SupplyTable";
import DeleteSupplyDialog from "./Components/DeleteSupplyDialog";

export default function Index({ supplies, filters, categories }) {
    const { data, setData } = useForm({
        search: filters.search ?? "",
        category: filters.category ?? "all",
        status: filters.status ?? "all",
    });

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(route("admin.supplies.index"), data, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [data.search, data.category, data.status]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route("admin.supplies.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const list = supplies.data ?? [];
    const total = paginatorTotal(supplies);

    return (
        <AppLayout>
            <Head title="Kelola Bahan" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Kelola Bahan"
                    subtitle={`${total} bahan terdaftar`}
                >
                    <Button asChild>
                        <Link href={route("admin.supplies.create")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Bahan
                        </Link>
                    </Button>
                </PageHeader>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative sm:col-span-2 lg:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                            placeholder="Cari nama, kode, kategori..."
                            className="rounded-xl border-border/60 bg-card pl-10 shadow-sm"
                        />
                    </div>
                    <Select
                        value={data.category}
                        onChange={(e) => setData("category", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua kategori</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </Select>
                    <Select
                        value={data.status}
                        onChange={(e) => setData("status", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua status</option>
                        <option value="tersedia">Tersedia</option>
                        <option value="tidak_tersedia">Tidak Tersedia</option>
                    </Select>
                </div>

                {total > 0 ? (
                    <SupplyTable
                        items={list}
                        pagination={supplies}
                        onDelete={setDeleteTarget}
                    />
                ) : (
                    <EmptyState
                        icon={Package}
                        title="Tidak ada bahan ditemukan"
                        description="Ubah filter atau tambahkan bahan baru ke inventaris."
                        action={
                            <Button asChild variant="outline">
                                <Link href={route("admin.supplies.create")}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah bahan
                                </Link>
                            </Button>
                        }
                    />
                )}
            </div>

            <DeleteSupplyDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                itemName={deleteTarget?.name}
                onConfirm={handleDelete}
                loading={deleting}
            />
        </AppLayout>
    );
}
