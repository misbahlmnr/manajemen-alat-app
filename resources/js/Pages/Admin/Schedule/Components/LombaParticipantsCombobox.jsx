import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/Components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * Searchable multi-select Combobox (Popover + Command) for Peserta Lomba.
 */
export default function LombaParticipantsCombobox({
    options = [],
    selectedIds = [],
    ketuaId = "",
    onChange,
    disabled = false,
    placeholder = "Cari dan pilih peserta…",
    emptyText = "Tidak ada siswa ditemukan.",
}) {
    const [open, setOpen] = useState(false);

    const selectedSet = useMemo(
        () => new Set((selectedIds ?? []).map(String)),
        [selectedIds],
    );

    const selectedOptions = useMemo(() => {
        const byId = new Map(options.map((opt) => [String(opt.id), opt]));
        return (selectedIds ?? [])
            .map((id) => byId.get(String(id)))
            .filter(Boolean);
    }, [options, selectedIds]);

    const triggerLabel = (() => {
        const count = selectedOptions.length;
        if (count === 0) {
            return placeholder;
        }
        if (count === 1) {
            return (
                selectedOptions[0].name ||
                selectedOptions[0].label ||
                "1 peserta"
            );
        }
        return `${count} peserta dipilih`;
    })();

    const emit = (nextIds, nextKetua) => {
        onChange({
            participant_ids: nextIds.map(Number),
            penanggung_jawab_id: nextKetua ? String(nextKetua) : "",
        });
    };

    const toggleParticipant = (id) => {
        const key = String(id);
        const current = (selectedIds ?? []).map(String);
        const isSelected = current.includes(key);

        if (isSelected) {
            const nextIds = current.filter((value) => value !== key);
            const nextKetua =
                String(ketuaId) === key ? "" : ketuaId ? String(ketuaId) : "";
            emit(nextIds, nextKetua);
            return;
        }

        const nextIds = [...current, key];
        const nextKetua = ketuaId ? String(ketuaId) : key;
        emit(nextIds, nextKetua);
    };

    const removeParticipant = (id) => {
        const key = String(id);
        const nextIds = (selectedIds ?? [])
            .map(String)
            .filter((value) => value !== key);
        const nextKetua =
            String(ketuaId) === key ? "" : ketuaId ? String(ketuaId) : "";
        emit(nextIds, nextKetua);
    };

    const setKetuaTim = (id) => {
        const key = String(id);
        if (!selectedSet.has(key)) {
            return;
        }
        emit((selectedIds ?? []).map(String), key);
    };

    return (
        <div className="space-y-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            "h-10 w-full justify-between font-normal",
                            selectedOptions.length === 0 &&
                                "text-muted-foreground",
                        )}
                    >
                        <span className="truncate">{triggerLabel}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                >
                    <Command>
                        <CommandInput placeholder="Cari nama siswa…" />
                        <CommandList>
                            <CommandEmpty>{emptyText}</CommandEmpty>
                            <CommandGroup>
                                {options.map((siswa) => {
                                    const key = String(siswa.id);
                                    const isSelected = selectedSet.has(key);

                                    return (
                                        <CommandItem
                                            key={siswa.id}
                                            value={String(
                                                siswa.label || siswa.name || "",
                                            )}
                                            onSelect={() =>
                                                toggleParticipant(siswa.id)
                                            }
                                        >
                                            <Check
                                                className={cn(
                                                    "h-4 w-4",
                                                    isSelected
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                )}
                                            />
                                            <span className="truncate">
                                                {siswa.label || siswa.name}
                                            </span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {selectedOptions.length > 0 && (
                <div className="space-y-2">
                    <ul className="flex flex-wrap gap-2">
                        {selectedOptions.map((siswa) => {
                            const isKetua =
                                String(ketuaId) === String(siswa.id);

                            return (
                                <li
                                    key={siswa.id}
                                    className="inline-flex max-w-full items-center gap-1"
                                >
                                    <Badge
                                        variant={
                                            isKetua ? "warning" : "secondary"
                                        }
                                        className="max-w-full gap-1.5 py-1 pl-2.5 pr-1"
                                    >
                                        <span className="truncate">
                                            {siswa.name || siswa.label}
                                        </span>
                                        {isKetua && (
                                            <span className="rounded-full bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                                                Ketua Tim
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            className="rounded-full p-0.5 opacity-70 transition-opacity hover:bg-black/5 hover:opacity-100"
                                            onClick={() =>
                                                removeParticipant(siswa.id)
                                            }
                                            disabled={disabled}
                                            aria-label={`Hapus ${siswa.name || "peserta"}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                    {!isKetua && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs text-muted-foreground"
                                            onClick={() =>
                                                setKetuaTim(siswa.id)
                                            }
                                            disabled={disabled}
                                        >
                                            Jadikan Ketua Tim
                                        </Button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {!ketuaId && (
                        <p className="text-sm text-amber-700">
                            Pilih Ketua Tim dari peserta di atas. Ketua Tim
                            menjadi peminjam alat.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
