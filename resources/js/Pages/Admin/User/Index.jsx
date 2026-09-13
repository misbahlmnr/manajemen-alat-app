import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import FilterToolbar from "@/Components/FilterToolbar";
import { paginatorTotal } from "@/lib/paginator";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    ArrowUpFromLine,
    GraduationCap,
    Plus,
    Search,
    Upload,
    Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import UserTable from "./Components/UserTable";
import DeleteUserDialog from "./Components/DeleteUserDialog";
import PromoteYearDialog from "./Components/PromoteYearDialog";

export default function Index({
    users,
    filters,
    promotePreview,
    scope = "siswa",
    classOptions = [],
    angkatanOptions = [],
}) {
    const isSiswa = scope === "siswa";
    const { data, setData } = useForm({
        search: filters.search ?? "",
        status: filters.status ?? "all",
        class: filters.class ?? "all",
        angkatan: filters.angkatan ?? "all",
        staff_role: filters.staff_role ?? "all",
    });

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [promoteOpen, setPromoteOpen] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                route("admin.users.index"),
                {
                    scope,
                    search: data.search,
                    status: data.status,
                    ...(isSiswa
                        ? { class: data.class, angkatan: data.angkatan }
                        : { staff_role: data.staff_role }),
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 400);

        return () => clearTimeout(timeout);
    }, [
        data.search,
        data.status,
        data.class,
        data.angkatan,
        data.staff_role,
        isSiswa,
        scope,
    ]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route("admin.users.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const openPromoteDialog = () => {
        setPromoteOpen(true);
        router.reload({
            only: ["promotePreview"],
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePromote = () => {
        setPromoting(true);
        router.post(
            route("admin.users.promote-year.store"),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setPromoteOpen(false),
                onFinish: () => setPromoting(false),
            },
        );
    };

    const list = users.data ?? [];
    const total = paginatorTotal(users);
    const createHref = route("admin.users.create", { scope });
    const title = isSiswa ? "Siswa" : "Staf";
    const subtitle = isSiswa
        ? "Akun siswa, kelas, dan angkatan"
        : "Akun Admin Lab dan Guru";

    return (
        <AppLayout>
            <Head title={title} />

            <div className="animate-fade-in mx-auto">
                <PageHeader title={title} subtitle={subtitle}>
                    {isSiswa && (
                        <>
                            <Button variant="outline" asChild>
                                <Link
                                    href={route("admin.users.class-options")}
                                >
                                    <GraduationCap className="mr-2 h-4 w-4" />
                                    Opsi kelas & angkatan
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={openPromoteDialog}
                            >
                                <ArrowUpFromLine className="mr-2 h-4 w-4" />
                                Naikkan tahun ajaran
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={route("admin.users.import")}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import Excel
                                </Link>
                            </Button>
                        </>
                    )}
                    <Button asChild>
                        <Link href={createHref}>
                            <Plus className="mr-2 h-4 w-4" />
                            {isSiswa ? "Tambah Siswa" : "Tambah Staf"}
                        </Link>
                    </Button>
                </PageHeader>

                <FilterToolbar
                    title={isSiswa ? "Filter siswa" : "Filter staf"}
                    description={
                        isSiswa
                            ? "Cari nama, email, atau NISN"
                            : "Cari nama, email, atau NIP"
                    }
                >
                    <div
                        className={`grid gap-3 sm:grid-cols-2 ${isSiswa ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
                    >
                        <div className="relative sm:col-span-2">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={data.search}
                                onChange={(e) =>
                                    setData("search", e.target.value)
                                }
                                placeholder={
                                    isSiswa
                                        ? "Cari nama, email, atau NISN..."
                                        : "Cari nama, email, atau NIP..."
                                }
                                className="pl-10"
                            />
                        </div>
                        {isSiswa ? (
                            <>
                                <Select
                                    value={data.class}
                                    onChange={(e) =>
                                        setData("class", e.target.value)
                                    }
                                >
                                    <option value="all">Semua kelas</option>
                                    {classOptions.map((cls) => (
                                        <option key={cls} value={cls}>
                                            {cls}
                                        </option>
                                    ))}
                                </Select>
                                <Select
                                    value={data.angkatan}
                                    onChange={(e) =>
                                        setData("angkatan", e.target.value)
                                    }
                                >
                                    <option value="all">Semua angkatan</option>
                                    {angkatanOptions.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </Select>
                            </>
                        ) : (
                            <Select
                                value={data.staff_role}
                                onChange={(e) =>
                                    setData("staff_role", e.target.value)
                                }
                            >
                                <option value="all">Semua role</option>
                                <option value="admin">Admin</option>
                                <option value="guru">Guru</option>
                            </Select>
                        )}
                        <Select
                            value={data.status}
                            onChange={(e) => setData("status", e.target.value)}
                        >
                            <option value="all">Semua status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                        </Select>
                    </div>
                </FilterToolbar>

                {total > 0 ? (
                    <UserTable
                        users={list}
                        pagination={users}
                        onDelete={setDeleteTarget}
                        scope={scope}
                    />
                ) : (
                    <EmptyState
                        icon={Users}
                        title={
                            isSiswa
                                ? "Tidak ada siswa ditemukan"
                                : "Tidak ada staf ditemukan"
                        }
                        description="Coba ubah kata kunci pencarian atau filter."
                        action={
                            <Button asChild variant="outline">
                                <Link href={createHref}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {isSiswa
                                        ? "Tambah siswa pertama"
                                        : "Tambah staf pertama"}
                                </Link>
                            </Button>
                        }
                    />
                )}
            </div>

            <DeleteUserDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                userName={deleteTarget?.name}
                onConfirm={handleDelete}
                loading={deleting}
            />

            {isSiswa && (
                <PromoteYearDialog
                    open={promoteOpen}
                    onOpenChange={setPromoteOpen}
                    preview={promotePreview}
                    onConfirm={handlePromote}
                    loading={promoting}
                />
            )}
        </AppLayout>
    );
}
