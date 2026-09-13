import InputError from "@/Components/InputError";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { useForm } from "@inertiajs/react";
import { useRef } from "react";

export default function UpdatePasswordForm({ className = "" }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (formErrors) => {
                if (formErrors.password) {
                    reset("password", "password_confirmation");
                    passwordInput.current?.focus();
                }

                if (formErrors.current_password) {
                    reset("current_password");
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <form onSubmit={updatePassword} className={`space-y-4 ${className}`}>
            <div className="space-y-2">
                <Label htmlFor="current_password">Kata sandi saat ini</Label>
                <Input
                    id="current_password"
                    ref={currentPasswordInput}
                    value={data.current_password}
                    onChange={(e) =>
                        setData("current_password", e.target.value)
                    }
                    type="password"
                    autoComplete="current-password"
                />
                <InputError message={errors.current_password} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Kata sandi baru</Label>
                <Input
                    id="password"
                    ref={passwordInput}
                    value={data.password}
                    onChange={(e) => setData("password", e.target.value)}
                    type="password"
                    autoComplete="new-password"
                />
                <InputError message={errors.password} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password_confirmation">
                    Konfirmasi kata sandi baru
                </Label>
                <Input
                    id="password_confirmation"
                    value={data.password_confirmation}
                    onChange={(e) =>
                        setData("password_confirmation", e.target.value)
                    }
                    type="password"
                    autoComplete="new-password"
                />
                <InputError message={errors.password_confirmation} />
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={processing}>
                    {processing ? "Menyimpan..." : "Simpan kata sandi"}
                </Button>
                {recentlySuccessful && (
                    <p className="text-sm text-muted-foreground">Tersimpan.</p>
                )}
            </div>
        </form>
    );
}
