import {
    BarChart3,
    Hand,
    LayoutDashboard,
    ToolCase,
    Users,
} from "lucide-react";

export const NAVBAR_ITEMS = [
    {
        label: "Beranda",
        href: route("dashboard"),
        icon: LayoutDashboard,
        routeName: "dashboard",
    },
    {
        label: "Kelola Pengguna",
        href: "#",
        icon: Users,
        routeName: "#",
    },
    {
        label: "Kelola Peralatan",
        href: "#",
        icon: ToolCase,
        routeName: "#",
    },
    {
        label: "Kelola Peminjaman",
        href: "#",
        icon: Hand,
        routeName: "#",
    },
    {
        label: "Laporan",
        href: "#",
        icon: BarChart3,
        routeName: "#",
    },
];
