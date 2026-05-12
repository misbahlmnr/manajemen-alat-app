import { useState, useEffect } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Camera, User, GraduationCap, Users, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import InputError from "@/Components/InputError";

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        username: "",
        password: "",
        remember: false,
        role: "siswa", // Default role
    });

    const roles = [
        { value: "siswa", label: "Siswa", icon: GraduationCap, desc: "Pinjam peralatan lab" },
        { value: "guru", label: "Guru", icon: User, desc: "Pantau peminjaman" },
        { value: "admin", label: "Admin", icon: Users, desc: "Kelola sistem" },
    ];

    useEffect(() => {
        return () => {
            reset("password");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <div className="min-h-screen flex bg-background font-sans">
            <Head title="Login" />

            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden p-12 flex-col justify-between">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-64 h-64 border-2 border-white rounded-full" />
                    <div className="absolute bottom-40 right-20 w-96 h-96 border-2 border-white rounded-full" />
                    <div className="absolute top-1/2 left-1/3 w-48 h-48 border-2 border-white rounded-full" />
                </div>

                <div className="relative z-10 flex flex-col justify-center h-full max-w-xl">
                    {/* Logo */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 mb-12"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
                            <Camera className="w-8 h-8 text-accent-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold text-white tracking-tight">Lab Audio Video</h1>
                            <p className="text-white/70 font-medium">SMK Negeri 7 Bekasi</p>
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h2 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl xl:text-6xl font-display font-bold text-white leading-tight mb-8"
                    >
                        Sistem Peminjaman<br />
                        <span className="text-accent">Peralatan Praktik</span>
                    </motion.h2>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg text-white/80 mb-10 leading-relaxed"
                    >
                        Platform digital untuk mengelola peminjaman peralatan praktik Audio Video secara efisien, transparan, dan terstruktur.
                    </motion.p>

                    {/* Features */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-2 gap-6"
                    >
                        {["Manajemen Stok", "Tracking Realtime", "Notifikasi Otomatis", "Laporan Digital"].map((feature) => (
                            <div key={feature} className="flex items-center gap-3 text-white/80">
                                <div className="w-2 h-2 rounded-full bg-accent" />
                                <span className="text-sm font-medium">{feature}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Footer decoration */}
                <div className="relative z-10 text-white/40 text-sm">
                    © 2026 SMK Negeri 7 Bekasi - Jurusan Audio Video
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="flex items-center gap-3 mb-10 lg:hidden">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                            <Camera className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-lg font-display font-bold text-foreground leading-tight">Lab Audio Video</h1>
                            <p className="text-sm text-muted-foreground font-medium">SMKN 7 Bekasi</p>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-display font-bold text-foreground">Selamat Datang</h2>
                        <p className="text-muted-foreground mt-2 font-medium">Masuk untuk mengakses sistem peminjaman</p>
                    </div>

                    {status && (
                        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl text-success text-sm font-medium">
                            {status}
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-foreground mb-4">
                            Masuk sebagai
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                const isActive = data.role === role.value;
                                return (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setData("role", role.value)}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all duration-300 text-center flex flex-col items-center justify-center gap-2",
                                            isActive
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border hover:border-primary/40 hover:bg-secondary/50"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "w-6 h-6 transition-colors",
                                            isActive ? "text-primary" : "text-muted-foreground"
                                        )} />
                                        <p className={cn(
                                            "text-xs font-bold tracking-wide uppercase",
                                            isActive ? "text-primary" : "text-foreground"
                                        )}>
                                            {role.label}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-2">
                                Username
                            </label>
                            <div className="relative group">
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={data.username}
                                    autoComplete="username"
                                    onChange={(e) => setData("username", e.target.value)}
                                    placeholder="Masukkan username Anda"
                                    className={cn(
                                        "form-input",
                                        errors.username && "border-destructive ring-destructive/20"
                                    )}
                                    required
                                    autoFocus
                                />
                            </div>
                            <InputError message={errors.username} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData("password", e.target.value)}
                                    placeholder="Masukkan password Anda"
                                    className={cn(
                                        "form-input pr-12",
                                        errors.password && "border-destructive ring-destructive/20"
                                    )}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData("remember", e.target.checked)}
                                        className="peer sr-only" 
                                    />
                                    <div className="h-5 w-5 rounded border-2 border-border peer-checked:bg-primary peer-checked:border-primary transition-all duration-200" />
                                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Ingat saya</span>
                            </label>
                            
                            {canResetPassword && (
                                <Link
                                    href={route("password.request")}
                                    className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
                                >
                                    Lupa password?
                                </Link>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary w-full shadow-lg shadow-primary/20"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Masuk ke Sistem"
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-border flex flex-col items-center gap-4">
                        <p className="text-xs text-muted-foreground text-center leading-relaxed">
                            Sistem ini dilindungi dan hanya dapat diakses oleh petugas dan siswa yang terdaftar di database laboratorium.
                        </p>
                        <div className="flex items-center gap-2">
                             <div className="h-1 w-1 rounded-full bg-border" />
                             <div className="h-1 w-1 rounded-full bg-border" />
                             <div className="h-1 w-1 rounded-full bg-border" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
