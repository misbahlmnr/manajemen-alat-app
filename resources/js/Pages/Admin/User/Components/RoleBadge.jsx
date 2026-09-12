import { cn } from "@/lib/utils";
import { GraduationCap, UserCog, Users } from "lucide-react";

const config = {
    siswa: {
        label: "Siswa",
        icon: GraduationCap,
        className: "border-transparent bg-blue-50 text-blue-700",
    },
    guru: {
        label: "Guru",
        icon: Users,
        className: "border-transparent bg-emerald-50 text-emerald-700",
    },
    admin: {
        label: "Admin",
        icon: UserCog,
        className: "border-transparent bg-violet-50 text-violet-700",
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
