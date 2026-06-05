import AppLayout from "@/Layouts/AppLayout";
import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import { paginatorTotal } from "@/lib/paginator";
import { cn } from "@/lib/utils";
import { Head, Link, router, useForm } from "@inertiajs/react";
import LoanCatalogTable from "./Components/LoanCatalogTable";
import {
    AlertTriangle,
    Calendar,
    CalendarDays,
    CreditCard,
    FileText,
    Info,
    MapPin,
    Package,
    Search,
    ArrowLeft,
    Send,
    ShoppingCart,
    Trophy,
    User,
    Wrench,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function formatScheduleTime(value) {
    if (!value) return "";
    return String(value).slice(0, 5);
}

export default function Create({
    loan = null,
    loanType,
    prefillItem,
    initialCart = [],
    catalog,
    catalogFilters,
    defaults,
    supervisorOptions = [],
    schedules = [],
    schedulesWithPast = [],
}) {
    const isEdit = Boolean(loan);
    const resolvedType =
        loanType === "bahan" || loan?.item_type === "bahan" ? "bahan" : "alat";
    const [tab, setTab] = useState(resolvedType);

    useEffect(() => {
        if (isEdit) return;
        setTab(loanType === "bahan" ? "bahan" : "alat");
    }, [loanType, isEdit]);
    const [searchQuery, setSearchQuery] = useState(
        catalogFilters?.search ?? "",
    );
    const [cart, setCart] = useState(() => (isEdit ? initialCart : []));
    const isFirstSearch = useRef(true);
    const { data, setData, post, put, processing, errors, transform } = useForm({
        ...defaults,
        item_type: resolvedType,
    });

    const catalogList = catalog?.data ?? [];
    const catalogTotal = paginatorTotal(catalog);
    const isBahan = tab === "bahan";

    useEffect(() => {
        if (isEdit || !prefillItem) return;
        setCart((c) =>
            c.find((i) => i.equipment.id === prefillItem.id)
                ? c
                : [...c, { equipment: prefillItem, quantity: 1 }],
        );
    }, [prefillItem, isEdit]);

    useEffect(() => {
        if (isFirstSearch.current) {
            isFirstSearch.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            const catalogRoute = isEdit
                ? route("siswa.loans.edit", loan.id)
                : route("siswa.loans.create");
            const params = isEdit
                ? { catalog_search: searchQuery }
                : { type: tab, catalog_search: searchQuery };

            router.get(catalogRoute, params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: isEdit
                    ? ["catalog", "catalogFilters", "initialCart"]
                    : ["catalog", "catalogFilters", "loanType"],
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery, tab, isEdit, loan?.id]);

    const switchTab = (t) => {
        setTab(t);
        setCart([]);
        setSearchQuery("");
        isFirstSearch.current = true;
        setData("item_type", t);
        router.get(
            route("siswa.loans.create"),
            { type: t },
            { preserveState: true },
        );
    };

    const maxQty = (eq) => {
        const cartItem = cart.find((i) => i.equipment.id === eq.id);
        const base = eq.available ?? 0;
        if (cartItem) {
            return Math.max(base, cartItem.quantity);
        }
        return base;
    };

    const addToCart = (eq) => {
        const existing = cart.find((i) => i.equipment.id === eq.id);
        if (existing) {
            if (existing.quantity < maxQty(eq)) {
                setCart(
                    cart.map((i) =>
                        i.equipment.id === eq.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i,
                    ),
                );
            }
        } else {
            setCart([...cart, { equipment: eq, quantity: 1 }]);
        }
    };

    const updateQty = (id, qty) => {
        if (qty <= 0) {
            setCart(cart.filter((i) => i.equipment.id !== id));
            return;
        }
        setCart(
            cart.map((i) =>
                i.equipment.id === id
                    ? {
                          ...i,
                          quantity: Math.min(qty, maxQty(i.equipment)),
                      }
                    : i,
            ),
        );
    };

    const isBawaPulang = !isBahan && data.borrow_scope === "bawa_pulang";
    const scheduleRequired = !isBahan && !isBawaPulang;
    const scheduleList = isBawaPulang ? schedulesWithPast : schedules;

    const selectedSchedule = useMemo(
        () =>
            scheduleList.find(
                (s) => String(s.id) === String(data.practicum_schedule_id),
            ),
        [scheduleList, data.practicum_schedule_id],
    );

    const applySchedule = (scheduleId) => {
        if (!scheduleId) {
            setData((prev) => ({ ...prev, practicum_schedule_id: "" }));
            return;
        }

        const s = scheduleList.find((x) => String(x.id) === String(scheduleId));
        if (!s?.tanggal) {
            setData("practicum_schedule_id", scheduleId);
            return;
        }
        const end = formatScheduleTime(s.jam_selesai);
        setData((prev) => ({
            ...prev,
            practicum_schedule_id: scheduleId,
            request_date: s.tanggal,
            due_at: end ? `${s.tanggal}T${end}` : `${s.tanggal}T23:59`,
        }));
    };

    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const collateralRequired =
        !isBahan && data.borrow_scope === "bawa_pulang";

    const submit = (e) => {
        e.preventDefault();

        transform((formData) => {
            const purpose =
                formData.notes?.trim() ||
                formData.purpose?.trim() ||
                "Peminjaman";

            const payload = {
                supervisor_id: formData.supervisor_id,
                item_type: tab,
                request_date:
                    formData.request_date ||
                    new Date().toISOString().slice(0, 10),
                purpose,
                notes: formData.notes ?? "",
                items: cart.map((i) => ({
                    equipment_id: i.equipment.id,
                    quantity: i.quantity,
                })),
            };

            if (!isBahan) {
                payload.borrow_scope = formData.borrow_scope;
                if (formData.practicum_schedule_id) {
                    payload.practicum_schedule_id =
                        formData.practicum_schedule_id;
                }
                payload.due_at = formData.due_at;
                if (formData.borrow_scope === "bawa_pulang") {
                    payload.collateral_agreed = formData.collateral_agreed
                        ? 1
                        : 0;
                }
            }

            return payload;
        });

        const visitOptions = {
            preserveScroll: true,
            onSuccess: () => {
                if (!isEdit) setCart([]);
            },
            onError: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        };

        if (isEdit) {
            put(route("siswa.loans.update", loan.id), visitOptions);
        } else {
            post(route("siswa.loans.store"), visitOptions);
        }
    };

    const formErrorList = Object.entries(errors).filter(
        ([, message]) => Boolean(message),
    );

    useEffect(() => {
        setData("item_type", tab);
    }, [tab]);

    const canSubmit =
        cart.length > 0 &&
        data.supervisor_id &&
        (isBahan ||
            ((!scheduleRequired || data.practicum_schedule_id) &&
                data.request_date &&
                data.due_at &&
                (!collateralRequired || data.collateral_agreed))) &&
        (data.notes?.trim() || data.purpose?.trim());

    return (
        <AppLayout>
            <Head title={isEdit ? "Ubah Pengajuan" : "Ajukan Peminjaman"} />

            <div className="animate-fade-in w-full min-w-0">
                <div className="page-header">
                    <div>
                        <h1 className="section-title">
                            {isEdit ? "Ubah Pengajuan" : "Ajukan Peminjaman"}
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            {isEdit
                                ? `Perbarui barang atau detail pengajuan • ${loan.code}`
                                : "Pilih jenis: pinjam alat atau ambil bahan"}
                        </p>
                    </div>
                    {isEdit && (
                        <Link
                            href={route("siswa.loans.show", loan.id)}
                            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    )}
                </div>

                {!isEdit && (
                <div className="mb-6 flex w-full flex-wrap items-center gap-2 rounded-lg bg-secondary p-1 sm:w-fit">
                    <button
                        type="button"
                        onClick={() => switchTab("alat")}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium sm:flex-none",
                            tab === "alat"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground",
                        )}
                    >
                        <Wrench className="h-4 w-4" /> Pinjam Alat
                    </button>
                    <button
                        type="button"
                        onClick={() => switchTab("bahan")}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium sm:flex-none",
                            tab === "bahan"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground",
                        )}
                    >
                        <Package className="h-4 w-4" /> Ambil Bahan
                    </button>
                </div>
                )}

                <div
                    className={cn(
                        "mb-6 flex items-start gap-3 rounded-lg p-3 text-sm",
                        isBahan
                            ? "bg-warning/10 text-warning"
                            : "bg-primary/10 text-primary",
                    )}
                >
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>
                        {isBahan
                            ? "Bahan sekali pakai, tidak perlu dikembalikan. Stok akan otomatis berkurang setelah disetujui."
                            : "Alat harus dikembalikan sebelum batas waktu. Permintaan akan diverifikasi admin."}
                    </p>
                </div>

                {formErrorList.length > 0 && (
                    <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                        <p className="mb-2 font-medium">
                            {isEdit ? "Perubahan gagal disimpan." : "Pengajuan gagal."}{" "}
                            Periksa data berikut:
                        </p>
                        <ul className="list-inside list-disc space-y-1">
                            {formErrorList.map(([key, message]) => (
                                <li key={key}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid min-w-0 gap-6 lg:grid-cols-3">
                    <div className="min-w-0 lg:col-span-2">
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                                placeholder={`Cari ${isBahan ? "bahan" : "alat"} (nama, kode, kategori)...`}
                                className="form-input min-w-0 pl-10"
                            />
                        </div>
                        <p className="mb-3 text-sm text-muted-foreground">
                            {catalogTotal}{" "}
                            {isBahan ? "bahan" : "alat"} tersedia
                            {searchQuery ? " untuk pencarian ini" : ""}
                        </p>
                        {catalogTotal > 0 ? (
                            <LoanCatalogTable
                                items={catalogList}
                                pagination={catalog}
                                isBahan={isBahan}
                                cart={cart}
                                onAdd={addToCart}
                                maxQty={maxQty}
                            />
                        ) : (
                            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                                Tidak ada {isBahan ? "bahan" : "alat"} yang
                                cocok dengan pencarian.
                            </p>
                        )}
                    </div>

                    <div className="min-w-0 lg:col-span-1">
                        <div className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-20 lg:p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <ShoppingCart className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Keranjang</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {totalItems} item
                                    </p>
                                </div>
                            </div>

                            {cart.length > 0 ? (
                                <div className="mb-5 space-y-2">
                                    {cart.map((item) => (
                                        <div
                                            key={item.equipment.id}
                                            className="flex flex-col gap-2 rounded-lg bg-secondary/50 p-3 sm:flex-row sm:items-center"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium leading-snug">
                                                    {item.equipment.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Max: {maxQty(item.equipment)}{" "}
                                                    {item.equipment.unit ??
                                                        "unit"}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center justify-between gap-1 sm:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQty(
                                                            item.equipment.id,
                                                            item.quantity - 1,
                                                        )
                                                    }
                                                    className="h-6 w-6 rounded border text-sm"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQty(
                                                            item.equipment.id,
                                                            item.quantity + 1,
                                                        )
                                                    }
                                                    disabled={
                                                        item.quantity >=
                                                        maxQty(item.equipment)
                                                    }
                                                    className="h-6 w-6 rounded border text-sm disabled:opacity-50"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQty(
                                                            item.equipment.id,
                                                            0,
                                                        )
                                                    }
                                                    className="ml-1 text-muted-foreground hover:text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Belum ada item
                                </p>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-sm font-medium">
                                        <User className="h-3.5 w-3.5" /> Guru
                                        Pembimbing
                                    </label>
                                    <select
                                        value={data.supervisor_id}
                                        onChange={(e) =>
                                            setData(
                                                "supervisor_id",
                                                e.target.value,
                                            )
                                        }
                                        className="form-input"
                                        disabled={processing}
                                    >
                                        <option value="">Pilih guru...</option>
                                        {supervisorOptions.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.supervisor_id}
                                    />
                                </div>

                                {!isBahan && (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-sm font-medium">
                                                <CalendarDays className="h-3.5 w-3.5" />{" "}
                                                Jadwal Praktikum
                                                {isBawaPulang ? (
                                                    <span className="text-xs font-normal text-muted-foreground">
                                                        (opsional)
                                                    </span>
                                                ) : (
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                )}
                                            </label>
                                            {isBawaPulang && (
                                                <p className="text-xs text-muted-foreground">
                                                    Boleh dikosongkan jika
                                                    tugas belum dikerjakan atau
                                                    jadwal praktikum sudah
                                                    lewat.
                                                </p>
                                            )}
                                            {scheduleList.length === 0 ? (
                                                <div
                                                    className={cn(
                                                        "flex items-start gap-2 rounded-lg p-2.5 text-xs",
                                                        isBawaPulang
                                                            ? "bg-secondary/60 text-muted-foreground"
                                                            : "bg-destructive/10 text-destructive",
                                                    )}
                                                >
                                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                                    <span>
                                                        {isBawaPulang
                                                            ? "Tidak ada jadwal tersedia — Anda tetap bisa mengajukan tanpa memilih jadwal."
                                                            : "Tidak ada jadwal aktif untuk kelas Anda."}
                                                    </span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={
                                                        data.practicum_schedule_id
                                                    }
                                                    onChange={(e) =>
                                                        applySchedule(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="form-input"
                                                    disabled={processing}
                                                >
                                                    <option value="">
                                                        {isBawaPulang
                                                            ? "Tanpa jadwal / pilih jika ada..."
                                                            : "Pilih jadwal..."}
                                                    </option>
                                                    {scheduleList.map((s) => (
                                                        <option
                                                            key={s.id}
                                                            value={s.id}
                                                        >
                                                            {s.tanggal
                                                                ? new Date(
                                                                      s.tanggal,
                                                                  ).toLocaleDateString(
                                                                      "id-ID",
                                                                      {
                                                                          day: "2-digit",
                                                                          month: "short",
                                                                      },
                                                                  )
                                                                : ""}{" "}
                                                            •{" "}
                                                            {formatScheduleTime(
                                                                s.jam_mulai,
                                                            )}{" "}
                                                            — {s.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            <InputError
                                                message={
                                                    errors.practicum_schedule_id
                                                }
                                            />
                                            {selectedSchedule && (
                                                <div
                                                    className={cn(
                                                        "space-y-1 rounded-lg border p-2.5 text-xs",
                                                        selectedSchedule.priority ===
                                                            "lomba"
                                                            ? "border-destructive/30 bg-destructive/5"
                                                            : selectedSchedule.priority ===
                                                                "tinggi"
                                                              ? "border-warning/30 bg-warning/5"
                                                              : "border-border bg-secondary/40",
                                                    )}
                                                >
                                                    <p className="font-medium">
                                                        {
                                                            selectedSchedule.mata_kuliah
                                                        }{" "}
                                                        •{" "}
                                                        {
                                                            selectedSchedule.kelas
                                                        }
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        {selectedSchedule.tanggal &&
                                                            new Date(
                                                                selectedSchedule.tanggal,
                                                            ).toLocaleDateString(
                                                                "id-ID",
                                                                {
                                                                    weekday:
                                                                        "long",
                                                                    day: "2-digit",
                                                                    month: "long",
                                                                },
                                                            )}{" "}
                                                        •{" "}
                                                        {formatScheduleTime(
                                                            selectedSchedule.jam_mulai,
                                                        )}
                                                        -
                                                        {formatScheduleTime(
                                                            selectedSchedule.jam_selesai,
                                                        )}
                                                    </p>
                                                    {selectedSchedule.priority ===
                                                        "lomba" && (
                                                        <p className="flex items-center gap-1 font-medium text-destructive">
                                                            <Trophy className="h-3 w-3" />{" "}
                                                            Prioritas Tinggi —
                                                            Lomba
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-1.5 text-sm font-medium">
                                                <MapPin className="h-3.5 w-3.5" />{" "}
                                                Lokasi Penggunaan
                                            </label>
                                            <div className="space-y-2">
                                                <label
                                                    className={cn(
                                                        "flex cursor-pointer items-start gap-2 rounded-lg border p-2.5",
                                                        data.borrow_scope ===
                                                            "lab"
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border",
                                                    )}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="borrow_scope"
                                                        value="lab"
                                                        checked={
                                                            data.borrow_scope ===
                                                            "lab"
                                                        }
                                                        onChange={() =>
                                                            setData((prev) => ({
                                                                ...prev,
                                                                borrow_scope: "lab",
                                                                collateral_agreed: false,
                                                            }))
                                                        }
                                                        className="mt-0.5"
                                                    />
                                                    <div className="text-sm">
                                                        <p className="font-medium">
                                                            Pakai di Lab
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Alat tidak dibawa
                                                            keluar. Tanpa
                                                            jaminan.
                                                        </p>
                                                    </div>
                                                </label>
                                                <label
                                                    className={cn(
                                                        "flex cursor-pointer items-start gap-2 rounded-lg border p-2.5",
                                                        data.borrow_scope ===
                                                            "bawa_pulang"
                                                            ? "border-warning bg-warning/5"
                                                            : "border-border",
                                                    )}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="borrow_scope"
                                                        value="bawa_pulang"
                                                        checked={
                                                            data.borrow_scope ===
                                                            "bawa_pulang"
                                                        }
                                                        onChange={() =>
                                                            setData((prev) => ({
                                                                ...prev,
                                                                borrow_scope:
                                                                    "bawa_pulang",
                                                            }))
                                                        }
                                                        className="mt-0.5"
                                                    />
                                                    <div className="text-sm">
                                                        <p className="font-medium">
                                                            Bawa Pulang
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Wajib jaminan kartu
                                                            pelajar. Jadwal
                                                            praktikum opsional.
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                            <InputError
                                                message={errors.borrow_scope}
                                            />
                                        </div>

                                        {collateralRequired && (
                                            <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                                                <div className="flex items-start gap-2">
                                                    <CreditCard className="mt-0.5 h-4 w-4 text-warning" />
                                                    <p className="text-xs">
                                                        Anda wajib menyerahkan{" "}
                                                        <strong>
                                                            kartu pelajar
                                                        </strong>{" "}
                                                        sebagai jaminan hingga
                                                        alat dikembalikan
                                                        lengkap.
                                                    </p>
                                                </div>
                                                <label className="flex cursor-pointer items-start gap-2 border-t border-warning/20 pt-2">
                                                    <Checkbox
                                                        checked={
                                                            data.collateral_agreed
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                "collateral_agreed",
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                        className="mt-0.5"
                                                    />
                                                    <span className="text-xs font-medium">
                                                        Saya setuju
                                                        menyerahkan kartu
                                                        pelajar sebagai jaminan
                                                    </span>
                                                </label>
                                                <InputError
                                                    message={
                                                        errors.collateral_agreed
                                                    }
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-sm font-medium">
                                                <Calendar className="h-3.5 w-3.5" />{" "}
                                                Tanggal Pengajuan
                                            </label>
                                            <input
                                                type="date"
                                                value={data.request_date}
                                                onChange={(e) =>
                                                    setData(
                                                        "request_date",
                                                        e.target.value,
                                                    )
                                                }
                                                className="form-input"
                                                disabled={processing}
                                            />
                                            <InputError
                                                message={errors.request_date}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-sm font-medium">
                                                <Calendar className="h-3.5 w-3.5" />{" "}
                                                Batas Kembali
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={data.due_at}
                                                onChange={(e) =>
                                                    setData(
                                                        "due_at",
                                                        e.target.value,
                                                    )
                                                }
                                                className="form-input"
                                                disabled={processing}
                                            />
                                            <InputError
                                                message={errors.due_at}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-sm font-medium">
                                        <FileText className="h-3.5 w-3.5" />{" "}
                                        Catatan / Keperluan
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData("notes", e.target.value)
                                        }
                                        placeholder={
                                            isBahan
                                                ? "Untuk praktikum..."
                                                : "Untuk tugas praktik..."
                                        }
                                        className="form-input min-h-[72px] resize-none"
                                        required
                                        disabled={processing}
                                    />
                                    <InputError message={errors.purpose} />
                                    <InputError message={errors.notes} />
                                </div>

                                <InputError message={errors.items} />

                                <button
                                    type="submit"
                                    disabled={!canSubmit || processing}
                                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {processing
                                        ? "Menyimpan..."
                                        : isEdit
                                          ? "Simpan Perubahan"
                                          : isBahan
                                            ? "Ambil Bahan"
                                            : "Ajukan Peminjaman"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
