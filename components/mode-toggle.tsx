"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      // Tambahkan ini biar React gak error kalau extension browser ngubah-ngubah atribut
      suppressHydrationWarning
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative overflow-hidden transition-all duration-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
    >
      {/* MATAHARI */}
      <Sun className="h-[1.4rem] w-[1.4rem] rotate-0 scale-100 transition-all duration-700 dark:-rotate-180 dark:scale-0 text-orange-500" />
      
      {/* BULAN */}
      <Moon className="absolute h-[1.4rem] w-[1.4rem] rotate-180 scale-0 transition-all duration-700 dark:rotate-0 dark:scale-100 text-blue-500 fill-blue-500/20" />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}