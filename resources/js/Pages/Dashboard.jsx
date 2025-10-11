import AppLayout from "@/Layouts/AppLayout";
import { Head, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";

export default function Dashboard() {
    const { props } = usePage();
    const data = props;

    // Use data from backend
    const nilaiData = data.chart_data?.nilai || [
        { name: "Jan", nilai: 85 },
        { name: "Feb", nilai: 88 },
        { name: "Mar", nilai: 92 },
    ];

    const absensiData = data.chart_data?.absensi || [
        { name: "Hadir", value: 85, color: "#16A34A" },
        { name: "Izin", value: 5, color: "#F59E0B" },
        { name: "Sakit", value: 5, color: "#EF4444" },
        { name: "Alpa", value: 5, color: "#6B7280" },
    ];

    const progresData = data.chart_data?.progres || [
        { name: "Materi", completed: 75 },
        { name: "Tugas", completed: 60 },
        { name: "Kuis", completed: 80 },
    ];

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Siswa
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.total_siswa || 0}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Kelas Aktif
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.total_kelas || 0}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Tugas Terkini
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.total_tugas || 0}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Rekomendasi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.total_rekomendasi || 0}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Performa Nilai</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={nilaiData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="nilai"
                                            stroke="#1F6FEB"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Status Absensi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={absensiData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) =>
                                                `${name} ${(
                                                    percent * 100
                                                ).toFixed(0)}%`
                                            }
                                        >
                                            {absensiData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Recommendations for Students */}
                {data.rekomendasi && data.rekomendasi.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Materi Rekomendasi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.rekomendasi.map((rek, index) => (
                                        <div
                                            key={index}
                                            className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500"
                                        >
                                            <h4 className="font-medium text-blue-900">
                                                {rek.materi?.judul}
                                            </h4>
                                            <p className="text-sm text-blue-700 mt-1">
                                                {rek.alasan}
                                            </p>
                                            <span
                                                className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                                                    rek.status === "aktif"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {rek.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Progres Belajar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={progresData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="completed" fill="#16A34A" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
