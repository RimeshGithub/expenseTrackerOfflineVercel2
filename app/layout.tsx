"use client"

import type React from "react"
import { useEffect } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { useFirebaseSync } from "@/hooks/use-firebase-sync"
import { useFirebaseAuth } from "@/hooks/use-firebase-auth"
import { AuthProvider } from "@/lib/auth-context"
import { storage } from "@/lib/storage"
import { Network } from "@capacitor/network"
import { useRouter } from "next/navigation"
import { App } from "@capacitor/app"
import { useSidebarStore } from "@/hooks/use-sidebar-store"
import { useEditFormStore } from "@/hooks/use-editform-store"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const { user, setupAuthListener } = useFirebaseAuth()
  const { syncData } = useFirebaseSync(user?.uid || null)

  // ⭐ Sidebar and Editform global store
  const { isOpen, close, open } = useSidebarStore()
  const { isFormOpen, closeForm } = useEditFormStore()

  // ⭐ BACK BUTTON HANDLER
  useEffect(() => {
    const listener = App.addListener("backButton", ({ canGoBack }) => {
      // 1️⃣ If sidebar is open, close it first
      if (isOpen || isFormOpen) {
        close()
        closeForm()
        return
      }

      // 2️⃣ Otherwise navigate back if possible
      if (canGoBack) {
        router.back()
      } else {
        // 3️⃣ Exit app when no history
        App.exitApp()
      }
    })

    return () => {
      listener.remove()
    }
  }, [isOpen, close, isFormOpen, closeForm, router])

  // ⭐ SWIPE GESTURE
  // useEffect(() => {
  //   let startX = 0

  //   document.addEventListener("touchstart", (e) => {
  //     startX = e.touches[0].clientX
  //   })

  //   document.addEventListener("touchend", (e) => {
  //     const endX = e.changedTouches[0].clientX
  //     const diff = endX - startX

  //     if (diff > 120) {   // threshold for swipe
  //       open()
  //     }
  //   })
  // }, [])

  // ⭐ Setup auth listener
  useEffect(() => {
    const unsubscribe = setupAuthListener()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [setupAuthListener])

  // ⭐ Auto-sync if online
  useEffect(() => {
    const unsubscribe = storage.onChange(async () => {
      const status = await Network.getStatus()

      if (storage.getData().settings.autoSync && status.connected) {
        syncData()
      }
    })

    return unsubscribe
  }, [syncData, user])

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
