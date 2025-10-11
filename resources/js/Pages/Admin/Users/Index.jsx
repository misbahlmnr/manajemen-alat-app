import AppLayout from "@/Layouts/AppLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Index({ users, role }) {
    const { flash } = usePage().props;

    const roleLabels = {
        admin: "Admin",
        guru: "Guru",
        siswa: "Siswa",
    };

    return (
        <AppLayout>
            <Head title={`Manajemen ${roleLabels[role]}`} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">
                        Manajemen {roleLabels[role]}
                    </h1>
                    <Button asChild>
                        <Link href={route("admin.users.create", { role })}>
                            Tambah {roleLabels[role]}
                        </Link>
                    </Button>
                </div>

                {/* Role Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    {Object.entries(roleLabels).map(([key, label]) => (
                        <Link
                            key={key}
                            href={route("admin.users.index", { role: key })}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                role === key
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                {flash?.message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {flash.message}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar {roleLabels[role]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">
                                            Nama
                                        </th>
                                        <th className="text-left py-3 px-4">
                                            Email
                                        </th>
                                        {role === "guru" && (
                                            <>
                                                <th className="text-left py-3 px-4">
                                                    NIP
                                                </th>
                                                <th className="text-left py-3 px-4">
                                                    Status
                                                </th>
                                            </>
                                        )}
                                        {role === "siswa" && (
                                            <>
                                                <th className="text-left py-3 px-4">
                                                    NIS
                                                </th>
                                                <th className="text-left py-3 px-4">
                                                    NISN
                                                </th>
                                                <th className="text-left py-3 px-4">
                                                    Angkatan
                                                </th>
                                            </>
                                        )}
                                        <th className="text-left py-3 px-4">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="py-3 px-4">
                                                {user.name}
                                            </td>
                                            <td className="py-3 px-4">
                                                {user.email}
                                            </td>
                                            {role === "guru" &&
                                                user.guru_profile && (
                                                    <>
                                                        <td className="py-3 px-4">
                                                            {
                                                                user
                                                                    .guru_profile
                                                                    .nip
                                                            }
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {
                                                                user
                                                                    .guru_profile
                                                                    .status_kepegawaian
                                                            }
                                                        </td>
                                                    </>
                                                )}
                                            {role === "siswa" &&
                                                user.siswa_profile && (
                                                    <>
                                                        <td className="py-3 px-4">
                                                            {
                                                                user
                                                                    .siswa_profile
                                                                    .nis
                                                            }
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {
                                                                user
                                                                    .siswa_profile
                                                                    .nisn
                                                            }
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {
                                                                user
                                                                    .siswa_profile
                                                                    .angkatan
                                                            }
                                                        </td>
                                                    </>
                                                )}
                                            <td className="py-3 px-4">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={route(
                                                                "admin.users.edit",
                                                                user.id
                                                            )}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
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

                        {/* Pagination */}
                        {users.links && (
                            <div className="mt-4 flex justify-center space-x-1">
                                {users.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3 py-2 text-sm rounded ${
                                            link.active
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </AppLayout>
    );
}
