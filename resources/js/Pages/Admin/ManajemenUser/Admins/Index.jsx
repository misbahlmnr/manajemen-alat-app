import AppLayout from "@/Layouts/AppLayout";
import { Head, Link, usePage, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { motion } from "framer-motion";

export default function Index({ admins }) {
    const handleDelete = (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus admin ini?")) {
            router.delete(route("admin.manajemen-user.admins.destroy", id));
        }
    };

    return (
        <AppLayout>
            <Head title="Manajemen Admin" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Manajemen Admin
                    </h1>
                    <Button asChild>
                        <Link
                            href={route("admin.manajemen-user.admins.create")}
                        >
                            Tambah Admin
                        </Link>
                    </Button>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Admin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {admins.data?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="text-left py-3 px-4">
                                                Nama
                                            </th>
                                            <th className="text-left py-3 px-4">
                                                Email
                                            </th>
                                            <th className="text-left py-3 px-4">
                                                Dibuat
                                            </th>
                                            <th className="text-left py-3 px-4">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {admins.data.map((admin) => (
                                            <tr
                                                key={admin.id}
                                                className="border-b hover:bg-gray-50 transition"
                                            >
                                                <td className="py-3 px-4">
                                                    {admin.name}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {admin.email}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {new Date(
                                                        admin.created_at
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={route(
                                                                    "admin.manajemen-user.admins.edit",
                                                                    admin.id
                                                                )}
                                                            >
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    admin.id
                                                                )
                                                            }
                                                        >
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                Tidak ada data admin.
                            </div>
                        )}

                        {/* ✅ Pagination Selalu Tampil */}
                        <div className="mt-6">
                            <Pagination>
                                <PaginationContent>
                                    {/* Tombol Previous */}
                                    <PaginationItem>
                                        {admins.prev_page_url ? (
                                            <PaginationPrevious asChild>
                                                <Link
                                                    href={admins.prev_page_url}
                                                >
                                                    Previous
                                                </Link>
                                            </PaginationPrevious>
                                        ) : (
                                            <PaginationPrevious className="opacity-50 cursor-not-allowed">
                                                Previous
                                            </PaginationPrevious>
                                        )}
                                    </PaginationItem>

                                    {/* Nomor Halaman */}
                                    {admins.links
                                        .filter(
                                            (link) =>
                                                link.label !==
                                                    "&laquo; Previous" &&
                                                link.label !== "Next &raquo;"
                                        )
                                        .map((link, index) => (
                                            <PaginationItem key={index}>
                                                {link.label === "..." ? (
                                                    <PaginationEllipsis />
                                                ) : (
                                                    <PaginationLink
                                                        asChild
                                                        isActive={link.active}
                                                    >
                                                        <Link
                                                            href={
                                                                link.url || "#"
                                                            }
                                                            dangerouslySetInnerHTML={{
                                                                __html: link.label,
                                                            }}
                                                        />
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}

                                    {/* Tombol Next */}
                                    <PaginationItem>
                                        {admins.next_page_url ? (
                                            <PaginationNext asChild>
                                                <Link
                                                    href={admins.next_page_url}
                                                >
                                                    Next
                                                </Link>
                                            </PaginationNext>
                                        ) : (
                                            <PaginationNext className="opacity-50 cursor-not-allowed">
                                                Next
                                            </PaginationNext>
                                        )}
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AppLayout>
    );
}
