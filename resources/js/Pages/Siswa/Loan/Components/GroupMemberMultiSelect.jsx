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

const MAX_MEMBERS = 10;

export default function GroupMemberMultiSelect({
    options = [],
    value = [],
    onChange,
    disabled = false,
    error,
}) {
    const [open, setOpen] = useState(false);
    const selectedIds = (value ?? []).map((id) => Number(id));

    const selected = useMemo(
        () =>
            options.filter((opt) => selectedIds.includes(Number(opt.id))),
        [options, selectedIds],
    );

    const toggle = (id) => {
        const numId = Number(id);
        if (selectedIds.includes(numId)) {
            onChange(selectedIds.filter((x) => x !== numId));
            return;
        }
        if (selectedIds.length >= MAX_MEMBERS) {
            return;
        }
        onChange([...selectedIds, numId]);
    };

    const remove = (id) => {
        onChange(selectedIds.filter((x) => x !== Number(id)));
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className="h-10 w-full justify-between font-normal"
                    >
                        <span className="truncate text-muted-foreground">
                            Pilih anggota kelompok
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Cari nama / NIS..." />
                        <CommandList>
                            <CommandEmpty>Tidak ada siswa.</CommandEmpty>
                            <CommandGroup>
                                {options.map((opt) => {
                                    const active = selectedIds.includes(
                                        Number(opt.id),
                                    );
                                    const atLimit =
                                        !active &&
                                        selectedIds.length >= MAX_MEMBERS;

                                    return (
                                        <CommandItem
                                            key={opt.id}
                                            value={`${opt.name} ${opt.nis ?? ""}`}
                                            disabled={atLimit}
                                            onSelect={() => toggle(opt.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    active
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                )}
                                            />
                                            <span className="flex-1 truncate">
                                                {opt.name}
                                            </span>
                                            {opt.nis ? (
                                                <span className="text-xs text-muted-foreground">
                                                    {opt.nis}
                                                </span>
                                            ) : null}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {selected.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {selected.map((opt) => (
                        <span
                            key={opt.id}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-medium"
                        >
                            {opt.name}
                            <button
                                type="button"
                                className="rounded-sm p-0.5 hover:bg-muted"
                                disabled={disabled}
                                onClick={() => remove(opt.id)}
                                aria-label={`Hapus ${opt.name}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
                {selectedIds.length} / {MAX_MEMBERS} anggota
            </p>
            {error ? (
                <p className="text-sm text-destructive">{error}</p>
            ) : null}
        </div>
    );
}
