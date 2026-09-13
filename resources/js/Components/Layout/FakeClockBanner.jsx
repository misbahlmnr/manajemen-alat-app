import { useAppClock } from "@/lib/appClock";

export default function FakeClockBanner() {
    const { isFake, label } = useAppClock();

    if (!isFake) {
        return null;
    }

    return (
        <div className="border-b border-amber-300/80 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-950">
            Jam uji aktif: {label}. Kosongkan{" "}
            <code className="rounded bg-amber-200/80 px-1">LAB_FAKE_NOW</code>{" "}
            lalu restart PHP (dan{" "}
            <code className="rounded bg-amber-200/80 px-1">
                php artisan config:clear
            </code>{" "}
            jika config di-cache) supaya kembali ke jam nyata.
        </div>
    );
}
