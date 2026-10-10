import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import FilterToolbar from "@/Components/FilterToolbar";
import { paginatorTotal } from "@/lib/paginator";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, router, useForm } from "@inertiajs/react";
import { Search, Wrench } from "lucide-react";
import { useEffect, useRef } from "react";
import EquipmentCatalogTable from "./Components/EquipmentCatalogTable";

export default function Index({ equipment, filters, categories }) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, setData } = useForm({
        search: filters.search ?? "",
        category: filters.category ?? "all",
        status: filters.status ?? "all",
        condition: filters.condition ?? "all",
        availability: filters.availability ?? "all",
        request_date: filters.request_date ?? today,
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
        data.request_date,
    ]);

    const list = equipment.data ?? [];
    const total = paginatorTotal(equipment);

    return (
        <AppLayout>
            <Head title="Alat Lab" />

            <div className="animate-fade-in w-full min-w-0">
                <PageHeader
                    title="Alat Lab"
                    subtitle="Ketersediaan mengikuti tanggal pengajuan — sama seperti halaman Ajukan"
                />

                <FilterToolbar
                    title="Cari & filter"
                    description={`${total} alat · ketersediaan untuk ${data.request_date || today}`}
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                        <div className="relative sm:col-span-2">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={data.search}
                                onChange={(e) =>
                                    setData("search", e.target.value)
                                }
                                placeholder="Cari nama, kode, kategori, lokasi..."
                                className="pl-10"
                            />
                        </div>
                        <Input
                            type="date"
                            value={data.request_date}
                            onChange={(e) =>
                                setData("request_date", e.target.value)
                            }
                            title="Tanggal pengajuan"
                        />
                        <Select
                            value={data.category}
                            onChange={(e) =>
                                setData("category", e.target.value)
                            }
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
                        >
                            <option value="all">Semua ketersediaan</option>
                            <option value="tersedia">Tersedia</option>
                            <option value="dipinjam">Sebagian Dipinjam</option>
                            <option value="habis">
                                Habis · antrean dibuka
                            </option>
                            <option value="rusak">Dalam Perbaikan</option>
                            <option value="tidak_tersedia">Tidak Tersedia</option>
                        </Select>
                        <Select
                            value={data.status}
                            onChange={(e) =>
                                setData("status", e.target.value)
                            }
                        >
                            <option value="all">Semua status</option>
                            <option value="tersedia">Aktif</option>
                            <option value="tidak_tersedia">
                                Nonaktif
                            </option>
                        </Select>
                    </div>
                </FilterToolbar>

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
                                        request_date: today,
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
