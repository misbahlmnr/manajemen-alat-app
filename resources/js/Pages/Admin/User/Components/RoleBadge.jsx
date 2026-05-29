import { cn } from "@/lib/utils";
import { GraduationCap, UserCog, Users } from "lucide-react";

const config = {
    siswa: {
        label: "Siswa",
        icon: GraduationCap,
        className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    },
    guru: {
        label: "Guru",
        icon: Users,
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    },
    admin: {
        label: "Admin",
        icon: UserCog,
        className: "bg-violet-500/10 text-violet-700 border-violet-500/20",
    },
};

export default function RoleBadge({ role }) {
    const item = config[role] ?? config.siswa;
    const Icon = item.icon;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                item.className,
            )}
        >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
        </span>
    );
}
