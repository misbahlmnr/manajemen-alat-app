import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import DataPagination from "@/Components/DataPagination";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, router, useForm } from "@inertiajs/react";
import { Package, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import SupplyCatalogCard from "./Components/SupplyCatalogCard";

export default function Index({ supplies, filters, categories }) {
    const { data, setData } = useForm({
        search: filters.search ?? "",
        category: filters.category ?? "all",
        status: filters.status ?? "all",
        stock_status: filters.stock_status ?? "all",
    });

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(route("siswa.supplies.index"), data, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [data.search, data.category, data.status, data.stock_status]);

    const list = supplies.data ?? [];

    return (
        <AppLayout>
            <Head title="Bahan Lab" />

            <div className="animate-fade-in">
                <PageHeader
                    title="Bahan Lab"
                    subtitle={`${supplies.meta?.total ?? 0} bahan praktikum`}
                />

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
                    <Select
                        value={data.stock_status}
                        onChange={(e) =>
                            setData("stock_status", e.target.value)
                        }
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua ketersediaan</option>
                        <option value="tersedia">Tersedia</option>
                        <option value="menipis">Stok Menipis</option>
                        <option value="habis">Habis</option>
                        <option value="nonaktif">Tidak Aktif</option>
                    </Select>
                    <Select
                        value={data.status}
                        onChange={(e) => setData("status", e.target.value)}
                        className="rounded-xl border-border/60 bg-card shadow-sm"
                    >
                        <option value="all">Semua status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                    </Select>
                </div>

                {list.length > 0 ? (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {list.map((item) => (
                                <SupplyCatalogCard key={item.id} supply={item} />
                            ))}
                        </div>
                        <div className="mt-8">
                            <DataPagination
                                links={supplies.links}
                                meta={supplies.meta}
                            />
                        </div>
                    </>
                ) : (
                    <EmptyState
                        icon={Package}
                        title="Tidak ada bahan ditemukan"
                        description="Ubah kata kunci pencarian atau filter untuk menemukan bahan lain."
                        action={
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setData({
                                        search: "",
                                        category: "all",
                                        status: "all",
                                        stock_status: "all",
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
