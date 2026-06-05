import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import { paginatorTotal } from "@/lib/paginator";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, router, useForm } from "@inertiajs/react";
import { Box, Package, Search, Wrench } from "lucide-react";
import { useEffect, useRef } from "react";
import GuruEquipmentTable from "./Components/GuruEquipmentTable";
import GuruSupplyTable from "./Components/GuruSupplyTable";

const typeTabs = [
    { key: "alat", label: "Alat", icon: Wrench },
    { key: "bahan", label: "Bahan", icon: Package },
];

export default function Index({
    inventarisType,
    equipment,
    supplies,
    filters,
    categories,
}) {
    const isBahan = inventarisType === "bahan";
    const paginator = isBahan ? supplies : equipment;
    const total = paginatorTotal(paginator);
    const list = paginator?.data ?? [];

    const { data, setData } = useForm({
        search: filters.search ?? "",
        category: filters.category ?? "all",
        status: filters.status ?? "all",
        condition: filters.condition ?? "all",
        availability: filters.availability ?? "all",
        stock_status: filters.stock_status ?? "all",
    });

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                route("guru.inventaris.index"),
                { ...data, type: inventarisType },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 400);

        return () => clearTimeout(timeout);
    }, [
        data.search,
        data.category,
        data.status,
        data.condition,
        data.availability,
        data.stock_status,
        inventarisType,
    ]);

    const switchType = (type) => {
        router.get(
            route("guru.inventaris.index"),
            { type },
            { preserveState: false },
        );
    };

    const resetFilters = () => {
        setData({
            search: "",
            category: "all",
            status: "all",
            condition: "all",
            availability: "all",
            stock_status: "all",
        });
    };

    return (
        <AppLayout>
            <Head title="Inventaris Lab" />

            <div className="animate-fade-in w-full min-w-0">
                <PageHeader
                    title="Inventaris Lab"
                    subtitle={`${total} ${isBahan ? "bahan" : "alat"} laboratorium`}
                />

                <div className="mb-6 flex w-full flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card p-1 shadow-sm sm:w-fit">
                    {typeTabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => switchType(key)}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
                                inventarisType === key
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>

                <div
                    className={cn(
                        "mb-6 grid gap-3",
                        isBahan
                            ? "sm:grid-cols-2 lg:grid-cols-4"
                            : "sm:grid-cols-2 lg:grid-cols-5",
                    )}
                >
                    <div className="relative sm:col-span-2">
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
                    {isBahan ? (
                        <Select
                            value={data.stock_status}
                            onChange={(e) =>
                                setData("stock_status", e.target.value)
                            }
                            className="rounded-xl border-border/60 bg-card shadow-sm"
                        >
                            <option value="all">Semua stok</option>
                            <option value="aman">Stok aman</option>
                            <option value="menipis">Stok menipis</option>
                            <option value="habis">Habis</option>
                        </Select>
                    ) : (
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
                    )}
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
                        {!isBahan && (
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
                        )}
                    </div>
                </div>

                {total > 0 ? (
                    isBahan ? (
                        <GuruSupplyTable items={list} pagination={supplies} />
                    ) : (
                        <GuruEquipmentTable
                            items={list}
                            pagination={equipment}
                        />
                    )
                ) : (
                    <EmptyState
                        icon={isBahan ? Package : Box}
                        title={`Tidak ada ${isBahan ? "bahan" : "alat"} ditemukan`}
                        description="Ubah kata kunci pencarian atau filter untuk menemukan item lain."
                        action={
                            <Button variant="outline" onClick={resetFilters}>
                                Reset filter
                            </Button>
                        }
                    />
                )}
            </div>
        </AppLayout>
    );
}
