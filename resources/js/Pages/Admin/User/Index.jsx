import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import EmptyState from "@/Components/EmptyState";
import { paginatorTotal } from "@/lib/paginator";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { Plus, Search, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import UserTable from "./Components/UserTable";
import RoleFilterTabs from "./Components/RoleFilterTabs";
import DeleteUserDialog from "./Components/DeleteUserDialog";

export default function Index({ users, filters, roleCounts }) {
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
                    subtitle={`${total} pengguna terdaftar`}
                >
                    <Button asChild>
                        <Link href={route("admin.users.create")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Pengguna
                        </Link>
                    </Button>
                </PageHeader>

                <RoleFilterTabs
                    value={data.role}
                    onChange={(role) => setData("role", role)}
                    counts={roleCounts}
                />

                <div className="relative mb-6 mt-6 max-w-xl">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={data.search}
                        onChange={(e) => setData("search", e.target.value)}
                        placeholder="Cari nama, email, NISN, atau NIP..."
                        className="rounded-xl border-border/60 bg-card pl-10 shadow-sm"
                    />
                </div>

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
