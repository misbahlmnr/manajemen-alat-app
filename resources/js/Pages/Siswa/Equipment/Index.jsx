import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import { paginatorTotal } from "@/lib/paginator";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, router, useForm } from "@inertiajs/react";
import { Search, Wrench } from "lucide-react";
import { useEffect, useRef } from "react";
import EquipmentCatalogTable from "./Components/EquipmentCatalogTable";

export default function Index({ equipment, filters, categories }) {
    const { data, setData } = useForm({
        search: filters.search ?? "",
        category: filters.category ?? "all",
        status: filters.status ?? "all",
        condition: filters.condition ?? "all",
        availability: filters.availability ?? "all",
    });

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(route("siswa.equipment.index"), data, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [
        data.search,
        data.category,
        data.status,
        data.condition,
        data.availability,
    ]);

    const list = equipment.data ?? [];
    const total = paginatorTotal(equipment);

    return (
        <AppLayout>
            <Head title="Alat Lab" />

            <div className="animate-fade-in w-full min-w-0">
                <PageHeader
                    title="Alat Lab"
                    subtitle={`${total} alat laboratorium`}
                />

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
                    <Select
                        value={data.availability}
                        onChange={(e) =>
                            setData("availability", e.target.value)
                        }
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua ketersediaan</option>
                        <option value="tersedia">Tersedia</option>
                        <option value="dipinjam">Sebagian Dipinjam</option>
                        <option value="habis">Tidak Tersedia</option>
                        <option value="rusak">Dalam Perbaikan</option>
                        <option value="nonaktif">Nonaktif</option>
                    </Select>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <EquipmentCatalogTable
                        items={list}
                        pagination={equipment}
                    />
                ) : (
                    <EmptyState
                        icon={Wrench}
                        title="Tidak ada alat ditemukan"
                        description="Ubah kata kunci pencarian atau filter untuk menemukan alat lain."
                        action={
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setData({
                                        search: "",
                                        category: "all",
                                        status: "all",
                                        condition: "all",
                                        availability: "all",
                                    });
                                }}
                            >
                                Reset filter
                            </Button>
                        }
                    />
                )}
            </div>
        </AppLayout>
    );
}
