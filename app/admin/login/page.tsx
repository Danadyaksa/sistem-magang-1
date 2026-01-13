"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Lock, 
  User, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Loader2, 
  CheckCircle 
} from "lucide-react"; 
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image"

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // State untuk Loading dan Sukses
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login gagal");
      }

      // --- LOGIKA: EFEK VISUAL SUKSES ---
      setIsLoading(false); // Stop loading spinner
      setIsSuccess(true);  // Aktifkan mode sukses (tombol jadi hijau)

      // Tunggu 1.5 detik sebelum pindah halaman
      setTimeout(() => {
        router.push("/admin/dashboard");
        router.refresh();
      }, 1000);

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      setIsSuccess(false);
    }
  };

  return (
    // WRAPPER: bg-slate-50 dark:bg-slate-950
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative transition-colors duration-300">
      
      {/* TOMBOL KEMBALI */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50">
        <Button asChild variant="ghost" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </Button>
      </div>

      {/* BACKGROUND PATTERN */}
      <div className="absolute inset-0 z-0 opacity-[0.4] dark:opacity-[0.2]" 
           style={{ 
             backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }}>
      </div>

      {/* LOGIN CARD */}
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800 relative z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-colors duration-300">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto">
            <Image
              src="/logo-disdikpora.png"
              alt="Logo Disdikpora DIY"
              width={52}
              height={52}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">Admin Portal</CardTitle>
          <CardDescription className="dark:text-slate-400">
            Masukkan kredensial administrator untuk masuk ke sistem manajemen magang.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="dark:text-slate-300">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="Masukkan username" 
                  className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-600"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading || isSuccess}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Masukkan password" 
                  className="pl-9 pr-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || isSuccess}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                  disabled={isLoading || isSuccess}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col pt-4">
            <Button 
              type="submit" 
              className={`w-full transition-all duration-300 text-white ${
                isSuccess 
                  ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700" 
                  : "bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
              }`}
              disabled={isLoading || isSuccess}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memeriksa...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 animate-bounce" /> Login Berhasil!
                </>
              ) : (
                "Masuk ke Dashboard"
              )}
            </Button>
            
            <div className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
              <p>Hanya personel berwenang yang diizinkan.</p>
              <p>© Dinas Dikpora DIY</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}