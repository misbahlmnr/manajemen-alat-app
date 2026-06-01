import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Plus, Search, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { paginatorTotal } from "@/lib/paginator";
import EquipmentTable from "./Components/EquipmentTable";
import DeleteEquipmentDialog from "./Components/DeleteEquipmentDialog";

export default function Index({ equipment, filters, categories }) {
    const { data, setData } = useForm({
        search: filters.search ?? "",
        category: filters.category ?? "all",
        status: filters.status ?? "all",
        condition: filters.condition ?? "all",
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
            router.get(route("admin.equipment.index"), data, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [data.search, data.category, data.status, data.condition]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route("admin.equipment.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const list = equipment.data ?? [];
    const total = paginatorTotal(equipment);

    return (
        <AppLayout>
            <Head title="Kelola Alat" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Kelola Alat"
                    subtitle={`${total} alat terdaftar`}
                >
                    <Button asChild>
                        <Link href={route("admin.equipment.create")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Alat
                        </Link>
                    </Button>
                </PageHeader>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative sm:col-span-2 lg:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={data.search}
                            onChange={(e) => setData("search", e.target.value)}
                            placeholder="Cari nama, kode, kategori, lokasi..."
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
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            value={data.status}
                            onChange={(e) => setData("status", e.target.value)}
                            className="rounded-xl border-border/60 bg-card shadow-sm"
                        >
                            <option value="all">Semua status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                        </Select>
                        <Select
                            value={data.condition}
                            onChange={(e) =>
                                setData("condition", e.target.value)
                            }
                            className="rounded-xl border-border/60 bg-card shadow-sm"
                        >
                            <option value="all">Semua kondisi</option>
                            <option value="baik">Baik</option>
                            <option value="rusak_ringan">Rusak Ringan</option>
                            <option value="rusak_berat">Rusak Berat</option>
                        </Select>
                    </div>
                </div>

                {total > 0 ? (
                    <EquipmentTable
                        items={list}
                        pagination={equipment}
                        onDelete={setDeleteTarget}
                    />
                ) : (
                    <EmptyState
                        icon={Wrench}
                        title="Tidak ada alat ditemukan"
                        description="Ubah filter atau tambahkan alat baru ke inventaris."
                        action={
                            <Button asChild variant="outline">
                                <Link href={route("admin.equipment.create")}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah alat
                                </Link>
                            </Button>
                        }
                    />
                )}
            </div>

            <DeleteEquipmentDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                itemName={deleteTarget?.name}
                onConfirm={handleDelete}
                loading={deleting}
            />
        </AppLayout>
    );
}
