import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedMenus, setExpandedMenus] = useState({});

    const getMenuItems = () => {
        const baseItems = [
            { name: "Dashboard", href: route("dashboard"), icon: "🏠" },
        ];

        if (user.role === "admin") {
            return [
                ...baseItems,
                {
                    name: "Manajemen User",
                    href: "#",
                    icon: "👥",
                    children: [
                        {
                            name: "Data Admin",
                            href: route("admin.manajemen-user.admins.index"),
                            icon: "👤",
                        },
                        {
                            name: "Data Guru",
                            href: route("admin.manajemen-user.gurus.index"),
                            icon: "👨‍🏫",
                        },
                        {
                            name: "Data Siswa",
                            href: route("admin.manajemen-user.siswas.index"),
                            icon: "👨‍🎓",
                        },
                    ],
                },
                { name: "Kelas", href: "#", icon: "📚" },
                { name: "Mata Pelajaran", href: "#", icon: "📖" },
                { name: "Jadwal", href: "#", icon: "📅" },
                { name: "Adaptive Rules", href: "#", icon: "⚙️" },
                { name: "Laporan", href: "#", icon: "📄" },
            ];
        } else if (user.role === "guru") {
            return [
                ...baseItems,
                { name: "Jadwal Mengajar", href: "#", icon: "📅" },
                { name: "Materi", href: "#", icon: "📖" },
                { name: "Tugas", href: "#", icon: "📝" },
                { name: "Nilai", href: "#", icon: "📊" },
                { name: "Absensi", href: "#", icon: "✅" },
                { name: "Adaptive Rules", href: "#", icon: "⚙️" },
            ];
        } else if (user.role === "siswa") {
            return [
                ...baseItems,
                { name: "Jadwal Hari Ini", href: "#", icon: "📅" },
                { name: "Materi", href: "#", icon: "📖" },
                { name: "Materi Rekomendasi", href: "#", icon: "💡" },
                { name: "Tugas", href: "#", icon: "📝" },
                { name: "Nilai", href: "#", icon: "📊" },
                { name: "Absensi", href: "#", icon: "✅" },
            ];
        }

        return baseItems;
    };

    const menuItems = getMenuItems();

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex">
            {/* Sidebar */}
            <motion.aside
                initial={{ width: sidebarOpen ? 256 : 64 }}
                animate={{ width: sidebarOpen ? 256 : 64 }}
                className="bg-[#1F6FEB] text-white shadow-lg"
            >
                <div className="p-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-white hover:bg-white/10"
                    >
                        {sidebarOpen ? "◀" : "▶"}
                    </Button>
                </div>
                <nav className="mt-8">
                    {menuItems.map((item) => (
                        <div key={item.name}>
                            {item.children ? (
                                <div>
                                    <button
                                        onClick={() =>
                                            setExpandedMenus((prev) => ({
                                                ...prev,
                                                [item.name]: !prev[item.name],
                                            }))
                                        }
                                        className="flex items-center w-full px-4 py-3 text-white hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-xl mr-3">
                                            {item.icon}
                                        </span>
                                        {sidebarOpen && (
                                            <span className="flex-1 text-left">
                                                {item.name}
                                            </span>
                                        )}
                                        {sidebarOpen && (
                                            <span className="ml-2 transition-transform">
                                                {expandedMenus[item.name]
                                                    ? "▼"
                                                    : "▶"}
                                            </span>
                                        )}
                                    </button>
                                    {sidebarOpen &&
                                        item.children &&
                                        expandedMenus[item.name] && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    height: 0,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    height: "auto",
                                                }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="ml-6 mt-1 overflow-hidden"
                                            >
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.name}
                                                        href={child.href}
                                                        className="flex items-center px-4 py-2 text-white/80 hover:bg-white/10 transition-colors text-sm"
                                                    >
                                                        <span className="text-lg mr-3">
                                                            {child.icon}
                                                        </span>
                                                        <span>
                                                            {child.name}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </motion.div>
                                        )}
                                </div>
                            ) : (
                                <Link
                                    href={item.href}
                                    className="flex items-center px-4 py-3 text-white hover:bg-white/10 transition-colors"
                                >
                                    <span className="text-xl mr-3">
                                        {item.icon}
                                    </span>
                                    {sidebarOpen && <span>{item.name}</span>}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-[#1F6FEB]">
                            SIAKAD SMP
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                Welcome, {user.name}
                            </span>
                            <Button variant="outline" size="sm">
                                Profile
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href={route("logout")} method="post">
                                    Logout
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
