"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // --- SIMULASI LOGIN (GANTI DENGAN API KAMU NANTI) ---
    // Di sini kamu nanti panggil API backend untuk cek database
    // Contoh simulasi sederhana:
    setTimeout(() => {
      if (username === "admin" && password === "admin123") {
        // Login Sukses
        router.push("/admin/dashboard"); // Redirect ke dashboard admin
      } else {
        // Login Gagal
        setError("Username atau password salah.");
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      
      {/* Background Decoration (Optional) */}
      <div className="absolute inset-0 z-0 opacity-[0.4]" 
           style={{ 
             backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }}>
      </div>

      <Card className="w-full max-w-md shadow-xl border-slate-200 relative z-10 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2">
            <Building2 className="h-8 w-8 text-blue-700" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Admin Portal</CardTitle>
          <CardDescription>
            Masukkan kredensial administrator untuk masuk ke sistem manajemen magang.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-50 text-red-600 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="Masukkan username" 
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Masukkan password" 
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col pt-4">
            <Button 
              type="submit" 
              className="w-full bg-blue-700 hover:bg-blue-800 transition-all" 
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk ke Dashboard"}
            </Button>
            
            <div className="mt-4 text-center text-xs text-slate-400">
              <p>Hanya personel berwenang yang diizinkan.</p>
              <p>© Dinas Dikpora DIY</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}