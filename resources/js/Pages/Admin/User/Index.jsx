import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import FilterToolbar from "@/Components/FilterToolbar";
import { paginatorTotal } from "@/lib/paginator";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select } from "@/Components/ui/select";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Plus, Search, Upload, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import UserTable from "./Components/UserTable";
import DeleteUserDialog from "./Components/DeleteUserDialog";

export default function Index({ users, filters }) {
    const { data, setData } = useForm({
        search: filters.search ?? "",
        role: filters.role ?? "all",
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
            router.get(
                route("admin.users.index"),
                { search: data.search, role: data.role },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 400);

        return () => clearTimeout(timeout);
    }, [data.search, data.role]);

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

    const list = users.data ?? [];
    const total = paginatorTotal(users);

    return (
        <AppLayout>
            <Head title="Kelola Pengguna" />

            <div className="animate-fade-in mx-auto">
                <PageHeader
                    title="Kelola Pengguna"
                    subtitle="Direktori akun Admin Lab, Guru, dan Siswa"
                >
                    <Button variant="outline" asChild>
                        <Link href={route("admin.users.import")}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import Excel
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={route("admin.users.create")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Pengguna
                        </Link>
                    </Button>
                </PageHeader>

                <FilterToolbar
                    title="Filter pengguna"
                    description="Cari nama, email, NISN, atau NIP"
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="relative sm:col-span-2">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={data.search}
                                onChange={(e) =>
                                    setData("search", e.target.value)
                                }
                                placeholder="Cari nama, email, NISN, atau NIP..."
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={data.role}
                            onChange={(e) => setData("role", e.target.value)}
                        >
                            <option value="all">Semua role</option>
                            <option value="admin">Admin</option>
                            <option value="guru">Guru</option>
                            <option value="siswa">Siswa</option>
                        </Select>
                    </div>
                </FilterToolbar>

                {total > 0 ? (
                    <UserTable
                        users={list}
                        pagination={users}
                        onDelete={setDeleteTarget}
                    />
                ) : (
                    <EmptyState
                        icon={Users}
                        title="Tidak ada pengguna ditemukan"
                        description="Coba ubah kata kunci pencarian atau filter role."
                        action={
                            <Button asChild variant="outline">
                                <Link href={route("admin.users.create")}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah pengguna pertama
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
        </AppLayout>
    );
}
