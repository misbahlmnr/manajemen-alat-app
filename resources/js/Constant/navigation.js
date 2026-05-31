import {
    BarChart3,
    Bell,
    Box,
    CalendarDays,
    ClipboardList,
    CreditCard,
    FileText,
    History,
    LayoutDashboard,
    Package,
    Users,
    Wrench,
} from "lucide-react";

/**
 * Menu navigasi per role — diselaraskan dengan patmawati-peminjaman-alat (GitMCP).
 * `href` memakai Ziggy `route()`; route belum ada memakai `#`.
 */
const adminMenuItems = [
    {
        icon: LayoutDashboard,
        label: "Dashboard",
        routeName: "dashboard",
    },
    {
        icon: Users,
        label: "Kelola Pengguna",
        routeName: "admin.users.index",
    },
    {
        icon: Wrench,
        label: "Kelola Alat",
        routeName: "admin.equipment.index",
    },
    {
        icon: Package,
        label: "Kelola Bahan",
        routeName: "admin.supplies.index",
    },
    {
        icon: CalendarDays,
        label: "Jadwal Praktikum",
        routeName: "admin.schedules.index",
    },
    {
        icon: ClipboardList,
        label: "Peminjaman",
        routeName: "admin.loans.index",
    },
    {
        icon: CreditCard,
        label: "Jaminan Kartu",
        routeName: "admin.collaterals.index",
    },
    {
        icon: Bell,
        label: "Notifikasi",
        routeName: null,
        href: "#",
    },
    {
        icon: BarChart3,
        label: "Laporan",
        routeName: null,
        href: "#",
    },
];

const guruMenuItems = [
    {
        icon: LayoutDashboard,
        label: "Dashboard",
        routeName: "dashboard",
    },
    {
        icon: Box,
        label: "Inventaris",
        routeName: null,
        href: "#",
    },
    {
        icon: CalendarDays,
        label: "Jadwal Praktikum",
        routeName: null,
        href: "#",
    },
    {
        icon: ClipboardList,
        label: "Peminjaman Siswa",
        routeName: null,
        href: "#",
    },
    {
        icon: History,
        label: "Riwayat",
        routeName: null,
        href: "#",
    },
    {
        icon: BarChart3,
        label: "Laporan",
        routeName: null,
        href: "#",
    },
];

const siswaMenuItems = [
    {
        icon: LayoutDashboard,
        label: "Dashboard",
        routeName: "dashboard",
    },
    {
        icon: Wrench,
        label: "Alat Lab",
        routeName: "siswa.equipment.index",
    },
    {
        icon: Package,
        label: "Bahan Lab",
        routeName: "siswa.supplies.index",
    },
    {
        icon: FileText,
        label: "Ajukan Peminjaman",
        routeName: null,
        href: "#",
    },
    {
        icon: ClipboardList,
        label: "Peminjaman Saya",
        routeName: null,
        href: "#",
    },
    {
        icon: History,
        label: "Riwayat",
        routeName: null,
        href: "#",
    },
    {
        icon: Bell,
        label: "Notifikasi",
        routeName: null,
        href: "#",
    },
];

const menusByRole = {
    admin: adminMenuItems,
    guru: guruMenuItems,
    siswa: siswaMenuItems,
};

export function getMenuItemsForRole(role) {
    return menusByRole[role] ?? siswaMenuItems;
}

function buildHref(item) {
    if (item.href) {
        if (!item.query) return item.href;
        const params = new URLSearchParams(item.query);
        return `${item.href}?${params.toString()}`;
    }

    if (item.routeName && typeof route === "function") {
        try {
            const base = route(item.routeName);
            if (!item.query) return base;
            const params = new URLSearchParams(item.query);
            return `${base}?${params.toString()}`;
        } catch {
            return "#";
        }
    }

    return "#";
}

export function resolveMenuItems(role) {
    return getMenuItemsForRole(role).map((item) => ({
        ...item,
        href: buildHref(item),
        key: `${item.label}-${item.routeName ?? item.href ?? "link"}`,
    }));
}

export function isNavItemActive(item, currentUrl) {
    if (!item.href || item.href === "#") return false;

    const [itemPath, itemQuery] = item.href.split("?");
    const [currentPath, currentQuery] = currentUrl.split("?");

    if (currentPath !== itemPath) return false;

    const itemTab = new URLSearchParams(itemQuery || "").get("tab");
    const currentTab = new URLSearchParams(currentQuery || "").get("tab");

    if (itemTab) return currentTab === itemTab;

    return !currentQuery || !itemQuery;
}

export function roleSubtitle(user) {
    if (!user) return "";
    if (user.role === "siswa" && user.class) return user.class;
    if (user.role === "admin") return "Administrator";
    if (user.role === "guru") return "Guru";
    return user.role ?? "";
}
