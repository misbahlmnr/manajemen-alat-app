import {
    BarChart3,
    Bell,
    Box,
    CalendarDays,
    ClipboardList,
    CreditCard,
    FileText,
    GraduationCap,
    History,
    LayoutDashboard,
    Package,
    Users,
    UserCog,
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
        type: "group",
        label: "Pengguna",
        icon: Users,
        items: [
            {
                icon: UserCog,
                label: "Staf",
                routeName: "admin.users.index",
                query: { scope: "pengguna" },
            },
            {
                icon: GraduationCap,
                label: "Siswa",
                routeName: "admin.users.index",
                query: { scope: "siswa" },
            },
        ],
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
        routeName: "admin.notifications.index",
    },
    {
        icon: BarChart3,
        label: "Laporan",
        routeName: "admin.reports.index",
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
        routeName: "guru.inventaris.index",
    },
    {
        icon: CalendarDays,
        label: "Jadwal Praktikum",
        routeName: "guru.schedules.index",
    },
    {
        icon: ClipboardList,
        label: "Pengajuan Siswa",
        routeName: "guru.loans.index",
    },
    {
        icon: History,
        label: "Riwayat",
        routeName: "guru.loans.index",
        query: { scope: "history" },
    },
    {
        icon: Bell,
        label: "Notifikasi",
        routeName: "guru.notifications.index",
    },
    {
        icon: BarChart3,
        label: "Laporan",
        routeName: "guru.reports.index",
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
        label: "Ajukan Alat / Bahan",
        routeName: "siswa.loans.create",
    },
    {
        icon: ClipboardList,
        label: "Alat & Bahan Saya",
        routeName: "siswa.loans.index",
    },
    {
        icon: History,
        label: "Riwayat Alat & Bahan",
        routeName: "siswa.loans.index",
        query: { scope: "history" },
    },
    {
        icon: Bell,
        label: "Notifikasi",
        routeName: "siswa.notifications.index",
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
    return getMenuItemsForRole(role).map((item) => resolveMenuItem(item));
}

function resolveMenuItem(item) {
    if (item.type === "group") {
        return {
            ...item,
            key: `group-${item.label}`,
            items: (item.items ?? []).map((child) => ({
                ...child,
                href: buildHref(child),
                key: `${child.label}-${child.routeName ?? child.href ?? "link"}`,
            })),
        };
    }

    return {
        ...item,
        href: buildHref(item),
        key: `${item.label}-${item.routeName ?? item.href ?? "link"}`,
    };
}

export function isNavItemActive(item, currentUrl) {
    if (!item.href || item.href === "#") return false;

    const [itemPath, itemQuery] = item.href.split("?");
    const [currentPath, currentQuery] = currentUrl.split("?");
    const itemParams = new URLSearchParams(itemQuery || "");
    const currentParams = new URLSearchParams(currentQuery || "");
    const itemScope = itemParams.get("scope");
    const currentScope = currentParams.get("scope");

    const onUsersSection =
        itemPath.endsWith("/admin/users") &&
        (currentPath === itemPath || currentPath.startsWith(`${itemPath}/`));

    if (onUsersSection && itemScope) {
        if (currentScope) {
            return currentScope === itemScope;
        }

        const siswaPages = [
            "/class-options",
            "/import",
            "/promote-year",
        ];

        if (itemScope === "siswa") {
            return siswaPages.some((suffix) => currentPath.endsWith(suffix));
        }

        return false;
    }

    if (currentPath !== itemPath) return false;

    const itemTab = itemParams.get("tab");
    const currentTab = currentParams.get("tab");
    if (itemTab) return currentTab === itemTab;

    if (itemScope) return currentScope === itemScope;
    if (currentScope) return false;

    return !currentQuery || !itemQuery;
}

export function isNavGroupActive(item, currentUrl) {
    return (item.items ?? []).some((child) =>
        isNavItemActive(child, currentUrl),
    );
}

export function roleSubtitle(user) {
    if (!user) return "";
    if (user.role === "siswa" && (user.class || user.angkatan)) {
        return [user.class, user.angkatan].filter(Boolean).join(" · ");
    }
    if (user.role === "admin") return "Administrator";
    if (user.role === "guru") return "Guru";
    return user.role ?? "";
}
