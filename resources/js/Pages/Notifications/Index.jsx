import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { Head, Link, router } from "@inertiajs/react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";

const severityStyles = {
    success: "border-emerald-200 bg-emerald-50/60",
    warning: "border-amber-200 bg-amber-50/60",
    error: "border-red-200 bg-red-50/60",
    info: "border-border/60 bg-card",
};

export default function Index({ notificationFeed, unreadCount = 0 }) {
    const items = notificationFeed?.data ?? [];

    const markAllRead = () => {
        router.post(route("notifications.read-all"), {}, { preserveScroll: true });
    };

    const markRead = (id) => {
        router.post(route("notifications.read", id), {}, { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="Notifikasi" />

            <div className="animate-fade-in w-full min-w-0">
                <PageHeader
                    title="Notifikasi"
                    subtitle="Pembaruan status peminjaman, persetujuan, keterlambatan, dan aktivitas lab"
                />

                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        {unreadCount > 0
                            ? `${unreadCount} notifikasi belum dibaca`
                            : "Semua notifikasi sudah dibaca"}
                    </p>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllRead}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Tandai semua dibaca
                        </Button>
                    )}
                </div>

                <div className="space-y-3">
                    {items.length === 0 ? (
                        <div className="rounded-2xl border border-border/60 bg-card px-6 py-16 text-center shadow-card">
                            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                            <p className="font-medium">Belum ada notifikasi</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Notifikasi akan muncul saat ada perubahan status
                                peminjaman atau aktivitas penting.
                            </p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "rounded-2xl border p-5 shadow-sm transition-colors",
                                    severityStyles[item.type] ?? severityStyles.info,
                                    !item.read && "ring-1 ring-primary/20",
                                )}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{item.title}</h3>
                                            {!item.read && (
                                                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                                                    Baru
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.message}
                                        </p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {item.created_at_human ?? item.created_at}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {!item.read && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => markRead(item.id)}
                                            >
                                                Tandai dibaca
                                            </Button>
                                        )}
                                        {item.action_url && (
                                            <Button
                                                asChild
                                                size="sm"
                                                onClick={() => {
                                                    if (!item.read) markRead(item.id);
                                                }}
                                            >
                                                <Link href={item.action_url}>
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Lihat
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {notificationFeed?.links?.length > 3 && (
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {notificationFeed.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url}
                                    className={cn(
                                        "rounded-lg px-3 py-1.5 text-sm",
                                        link.active
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary text-foreground hover:bg-secondary/80",
                                    )}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={`${link.label}-${index}`}
                                    className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
