import AppLayout from "@/Layouts/AppLayout";
import { Head, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Inbox,
    Send,
    Archive,
    ClipboardList,
    Clock,
    CheckCircle,
    FileText,
    Activity,
} from "lucide-react";

export default function Dashboard() {
    const { props } = usePage();
    const data = props;

    const stats = [
        {
            title: "Total Surat Masuk",
            value: data.total_surat_masuk || 0,
            icon: Inbox,
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
        },
        {
            title: "Total Surat Keluar",
            value: data.total_surat_keluar || 0,
            icon: Send,
            bgColor: "bg-green-50",
            textColor: "text-green-600",
        },
        {
            title: "Total Disposisi",
            value: data.total_disposisi || 0,
            icon: ClipboardList,
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
        },
        {
            title: "Total Arsip",
            value: data.total_arsip || 0,
            icon: Archive,
            bgColor: "bg-orange-50",
            textColor: "text-orange-600",
        },
    ];

    const statusStats = [
        {
            title: "Menunggu Verifikasi",
            value: data.surat_pending || 0,
            icon: Clock,
        },
        {
            title: "Sedang Diproses",
            value: data.surat_proses || 0,
            icon: FileText,
        },
        {
            title: "Selesai",
            value: data.surat_selesai || 0,
            icon: CheckCircle,
        },
    ];

    return (
        <AppLayout>
            <Head title="Dashboard Admin" />

            <div className="space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Dashboard
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Ringkasan data sistem pengarsipan surat desa
                        </p>
                    </div>

                    <Badge variant="secondary" className="px-3 py-1">
                        <Activity className="w-4 h-4 mr-2" />
                        Sistem Aktif
                    </Badge>
                </motion.div>

                {/* Statistik Utama */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {stats.map((stat, index) => (
                        <Card key={index}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        {stat.title}
                                    </CardTitle>
                                    <div
                                        className={`p-2 rounded-lg ${stat.bgColor}`}
                                    >
                                        <stat.icon
                                            className={`w-5 h-5 ${stat.textColor}`}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">
                                    {stat.value.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>

                {/* Status Surat */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Status Surat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {statusStats.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center p-4 bg-gray-50 rounded-lg"
                                    >
                                        <item.icon className="w-6 h-6 mr-3 text-gray-600" />
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {item.value}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {item.title}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Surat Terbaru */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Surat Terbaru</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.recent_surat?.length ? (
                                    data.recent_surat.map((surat) => (
                                        <div
                                            key={surat.id}
                                            className="flex justify-between items-center border-b pb-3"
                                        >
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {surat.nomor_surat}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {surat.perihal}
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {surat.tanggal}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Belum ada data surat terbaru.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </AppLayout>
    );
}
