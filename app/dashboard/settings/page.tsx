"use client"

import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { useTransactions } from "@/hooks/use-transactions"
import { useCategories } from "@/hooks/use-categories"
import { useAccounts } from "@/hooks/use-accounts"
import { useFirebaseAuth } from "@/hooks/use-firebase-auth"
import { useFirebaseSync } from "@/hooks/use-firebase-sync"
import { storage } from "@/lib/storage"
import { Database, HelpCircle, Download, Trash2, CloudDownload, DollarSign, Palette, X, Cloud, LogOut, LogIn, RefreshCwIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Category, Account } from "@/lib/types"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { type Transaction } from "@/lib/types"
import NepaliDate from "nepali-date-converter"
import { ReportGenerator } from "@/components/report-generator"

export default function SettingsPage() {
  const { transactions } = useTransactions()
  const { incomeCategories, expenseCategories, addCategory, deleteCategory, getCustomCategories, deleteTransactionsByCategory } = useCategories()
  const { accounts, getCustomAccounts, addAccount, deleteAccount, deleteTransactionsByAccount } = useAccounts()
  const { toast } = useToast()
  const {
    user,
    loading: authLoading,
    error: authError,
    login,
    signup,
    logout,
    setupAuthListener,
    isInitialized,
  } = useFirebaseAuth()
  const { isSyncing, isRestoring, lastSyncTime, syncError, isOnline, syncData, restoreData } = useFirebaseSync(user?.uid || null)
  const router = useRouter()

  // App preferences state
  const [currency, setCurrency] = useState("Rs")
  const [autoSync, setAutoSync] = useState(false)

  const [categoryType, setCategoryType] = useState<"expense" | "income">("expense")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryIcon, setNewCategoryIcon] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("bg-gray-400")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [customCategories, setCustomCategories] = useState<Category[]>([...getCustomCategories('expense'), ...getCustomCategories('income')])
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountIcon, setNewAccountIcon] = useState("")
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [customAccounts, setCustomAccounts] = useState<Account[]>([...getCustomAccounts()])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [carryOver, setCarryOver] = useState("off")
  const [carryOverAccount, setCarryOverAccount] = useState("cash")

  // Firebase auth state
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Get today's date
  const today = new Date()
  const todayADYear = today.getFullYear()
  const todayADMonth = today.getMonth() // 0-based index
  const todayBS = new NepaliDate(today).getBS()
  const todayBSYear = todayBS.year
  const todayBSMonth = todayBS.month

  // Transaction filters for export
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])

  const [useBSDate, setUseBSDate] = useState(false) // Toggle between AD/BS
  useEffect(() => {
    const stored = localStorage.getItem("useBSDateExport")
    if (stored !== null) {
      setUseBSDate(JSON.parse(stored))
    }

    const storedCarryOver = localStorage.getItem("carryOver")
    if (storedCarryOver !== null) {
      setCarryOver(storedCarryOver)
    }

    const storedCarryOverAccount = localStorage.getItem("carryOverAccount")
    if (storedCarryOverAccount !== null) {
      setCarryOverAccount(storedCarryOverAccount)
    }
  }, [])

  const [filterYear, setFilterYear] = useState(todayADYear.toString())
  const [filterMonth, setFilterMonth] = useState(todayADMonth.toString())
  
  // Month names
  const adMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const bsMonths = [
    "Baisakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Ashwin",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
  ]

  // Year options based on calendar type
  const yearOptions = useBSDate ? [2080, 2081, 2082, 2083, 2084, 2085, 2086, 2087] : [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]
  const monthOptions = useBSDate ? bsMonths : adMonths

  useEffect(() => {
    setAllTransactions([...transactions]) // new array
  }, [transactions])

  // Filtering logic
  useEffect(() => {
    let filtered = allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Date filtering based on selected calendar type
    if (filterYear !== "all") {
      filtered = filtered.filter((t) => {
        if (useBSDate) {
          const bs = new NepaliDate(new Date(t.date)).getBS()
          return bs.year.toString() === filterYear
        } else {
          return new Date(t.date).getFullYear().toString() === filterYear
        }
      })
    }

    if (filterMonth !== "all") {
      filtered = filtered.filter((t) => {
        if (useBSDate) {
          const bs = new NepaliDate(new Date(t.date)).getBS()
          return bs.month.toString() === filterMonth
        } else {
          return new Date(t.date).getMonth().toString() === filterMonth
        }
      })
    }
    setFilteredTransactions(filtered)
  }, [
    filterYear,
    filterMonth,
    useBSDate,
    allTransactions
  ])

  // Reset date filters when switching calendar type
  useEffect(() => {
    if (useBSDate) {
      setFilterYear(todayBSYear.toString())
      setFilterMonth(todayBSMonth.toString())
    } else {
      setFilterYear(todayADYear.toString())
      setFilterMonth(todayADMonth.toString())
    }
  }, [useBSDate])

  // Setup auth listener on mount
  useEffect(() => {
    const unsubscribe = setupAuthListener()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [setupAuthListener])

  useEffect(() => {
    const settings = storage.getSettings()
    setCurrency(settings.currency)
    setAutoSync(settings.autoSync)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Error",
        description: "Please enter email and password.",
        variant: "destructive",
      })
      return
    }

    const success = isSignup ? await signup(loginEmail, loginPassword) : await login(loginEmail, loginPassword)

    if (success) {
      toast({
        title: isSignup ? "Account Created" : "Logged In",
        description: isSignup ? "Your account has been created successfully." : "You have been logged in successfully.",
      })
      setLoginEmail("")
      setLoginPassword("")
      setShowLoginForm(false)
      setIsSignup(false)
    } else {
      toast({
        title: "Error",
        description: authError || (isSignup ? "Failed to create account." : "Failed to login."),
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    const success = await logout()
    if (success) {
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      })
    }
  }

  const handleManualSync = async () => {
    const success = await syncData()
    if (success) {
      toast({
        title: "Sync Successful",
        description: "Your data has been synced to Firebase.",
      })
    } else {
      toast({
        title: "Sync Failed",
        description: syncError || "Failed to sync data.",
        variant: "destructive",
      })
    }
  }

  const handleRestore = async () => {
    const ok = window.confirm(
      "Are you sure you want to restore data from Cloud? This will overwrite your local data."
    )
    if (!ok) return

    const success = await restoreData()

    if (success) {
      toast({
        title: "Restore Successful",
        description: "Your data has been restored from Cloud.",
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } else {
      toast({
        title: "Restore Failed",
        description: syncError || "Failed to restore data.",
        variant: "destructive",
      })
    }
  }

  const getCategoryName = (catId: string) => {
    const category = [...expenseCategories, ...incomeCategories].find((c) => c.id === catId)
    return category ? category.name : catId
  }

  const getAccountName = (accId: string) => {
    const account = accounts.find((a) => a.id === accId)
    return account ? account.name : accId
  }

  const handleExportData = async (format: "csv" | "txt") => {
    if (!filteredTransactions.length) {
      toast({
        title: "No Data",
        description: "You don't have any transactions to export.",
        variant: "destructive",
      })
      return
    }

    const filtered = filteredTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const filterCondition: string = filterYear === "all" && filterMonth === "all" ? "All" : filterYear === "all" ? "Year" : filterMonth === "all" ? "Month" : "Date"
    const ok = window.confirm(
      `Do you want to export ${filterCondition === "All" ? "all of your transactions" : "your transactions of "}${filterCondition === "Date" ? `${monthOptions[parseInt(filterMonth)]}, ${filterYear} ${useBSDate ? "BS" : "AD"}` :
        filterCondition === "Year" ? `${monthOptions[parseInt(filterMonth)]}` : filterCondition === "Month" ? `${filterYear} ${useBSDate ? "BS" : "AD"}` : ""} in ${format === "csv" ? "CSV" : "TXT"} format?`
    )
    if (!ok) return

    setIsExporting(true)

    try {
      let content: string
      let filename: string
      let mimeType: string

      const d = new Date()
      let stamp = filterCondition === "Date" ? `${monthOptions[parseInt(filterMonth)]}-${filterYear}${useBSDate ? "BS" : "AD"}-` :
        filterCondition === "Year" ? `${monthOptions[parseInt(filterMonth)]}-` : filterCondition === "Month" ? `${filterYear}${useBSDate ? "BS" : "AD"}-` : ""
      stamp += `exported-${d.getFullYear()}-${(d.getMonth()+1)
        .toString().padStart(2,"0")}-${d.getDate()
        .toString().padStart(2,"0")}_${d.getHours()
        .toString().padStart(2,"0")}-${d.getMinutes()
        .toString().padStart(2,"0")}-${d.getSeconds()
        .toString().padStart(2,"0")}`

      if (format === "csv") {
        const headers = ["Date", "Account", "Type", "Category", "Description", "Income", "Expense", "Balance"]
        let runningBalance = 0
        let totalIncome = 0
        let totalExpense = 0

        const csvContent = [
          headers.join(","),

          ...filtered.map((t) => {
            const isIncome = t.type.toLowerCase() === "income"
            const income = isIncome ? t.amount : ""
            const expense = !isIncome ? t.amount : ""

            // Update running balance
            runningBalance += isIncome ? t.amount : -t.amount

            // Update total income and expense
            totalIncome += isIncome ? t.amount : 0
            totalExpense += !isIncome ? t.amount : 0

            return [
              customDateFormat(t.date),
              getAccountName(t.account),
              t.type,
              getCategoryName(t.category),
              `"${t.description.replace(/"/g, '""')}"`,
              income,
              expense,
              runningBalance,
            ].join(",")
          }),

          ["", "", "", "", "Total", totalIncome, totalExpense, runningBalance],
        ].join("\n")

        content = csvContent
        filename = `nepali-wallet-${stamp}.csv`
        mimeType = "text/csv"
      } else {
        const filteredMap = filtered.map((t) => ({
          date: customDateFormat(t.date),
          account: getAccountName(t.account),
          type: t.type,
          category: getCategoryName(t.category),
          amount: t.amount,
          description: t.description,
        }));

        content = JSON.stringify(filteredMap, null, 2)
        filename = `nepali-wallet-${stamp}.txt`
        mimeType = "text/plain"
      }

      // ---------------------------------------------------------
      // ✅ WEB EXPORT
      // ---------------------------------------------------------
      if (!Capacitor.isNativePlatform()) {
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)

        toast({
          title: "Export Successful",
          description: `Your data has been exported as ${format.toUpperCase()}.`,
        })

        return
      }

      // ---------------------------------------------------------
      // ✅ ANDROID EXPORT (fix for parent directory error)
      // ---------------------------------------------------------
      if (Capacitor.getPlatform() === "android") {
        const folder = "NepaliWallet"

        // Create folder if missing
        await Filesystem.mkdir({
          path: folder,
          directory: Directory.Documents,
          recursive: true,
        }).catch(() => {})

        // Write file
        const result = await Filesystem.writeFile({
          path: `${folder}/${filename}`,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
        })

        toast({
          title: "Export Successful",
          description: `Saved to Documents/${folder}`,
        })

        return result.uri
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const customDateFormat = (date: string) => {
    const d = new Date(date)
    if(useBSDate) {
      const nepaliDate = new NepaliDate(new Date(date))
      return `${nepaliDate.getYear()}-${(nepaliDate.getMonth() + 1).toString().padStart(2,"0")}-${nepaliDate.getDate().toString().padStart(2,"0")}`
    }
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`
  }

  const handlePreferenceUpdate = (key: string, value: any) => {
    if (key === "currency" || key === "autoSync") {
      storage.updateSettings({ [key]: value })
    }

    if(key === "autoSync") {
      syncData()
    }

    switch (key) {
      case "currency":
        setCurrency(value)
        break
      case "autoSync":
        setAutoSync(value)
        break
    }

    toast({
      title: "Preferences Updated",
      description: "Your preferences have been saved.",
    })
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name.",
        variant: "destructive",
      })
      return
    }

    setIsAddingCategory(true)
    try {
      const categoryIcon = newCategoryIcon || newCategoryName[0].toUpperCase()
      await addCategory(newCategoryName, categoryIcon, newCategoryColor, categoryType)
      setNewCategoryName("")
      setNewCategoryIcon("")
      setNewCategoryColor("bg-gray-400")
      setCustomCategories([...getCustomCategories('expense'), ...getCustomCategories('income')])
      toast({
        title: "Category Added",
        description: `"${newCategoryName}" has been added to ${categoryType} categories.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    const confirm = window.confirm(`Are you sure you want to delete "${categoryName}" category and its associated transactions?`)
    if (!confirm) return

    try {
      deleteCategory(categoryId)
      deleteTransactionsByCategory(categoryId)
      setCustomCategories([...getCustomCategories('expense'), ...getCustomCategories('income')])
      setAllTransactions(allTransactions.filter((t) => t.category !== categoryId))
      toast({
        title: "Category Deleted",
        description: `${categoryName} has been removed.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an account name.",
        variant: "destructive",
      })
      return
    }

    setIsAddingAccount(true)
    try {
      const accountIcon = newAccountIcon || newAccountName[0].toUpperCase()
      await addAccount(newAccountName, accountIcon)
      setNewAccountName("")
      setNewAccountIcon("")
      setCustomAccounts([...getCustomAccounts()])
      toast({
        title: "Account Added",
        description: `"${newAccountName}" has been added`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingAccount(false)
    }
  }

  const handleDeleteAccount = (accId: string, accName: string) => {
    const confirm = window.confirm(`Are you sure you want to delete "${accName}" account and its associated transactions?`)
    if (!confirm) return

    try {
      deleteAccount(accId)
      deleteTransactionsByAccount(accId)
      setCustomAccounts([...getCustomAccounts()])
      setAllTransactions(allTransactions.filter((t) => t.account !== accId))
      toast({
        title: "Account Deleted",
        description: `${accName} has been removed.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleClearAllData = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear all data? This action cannot be undone and will permanently delete all your transactions.",
    )

    if (!confirmClear) return

    storage.clearAllData()
    toast({
      title: "Data Cleared",
      description: "All your data has been permanently deleted.",
    })

    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences and data.</p>
        </div>

        <div className="grid gap-6 max-w-3xl">
          {isInitialized && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Cloud Sync
                </CardTitle>
                <CardDescription>Backup and restore your data with Firebase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!user ? (
                  <>
                    {!showLoginForm ? (
                      <Button onClick={() => setShowLoginForm(true)} className="w-full">
                        <LogIn className="h-4 w-4 mr-2" />
                        Login to Enable Cloud Sync
                      </Button>
                    ) : (
                      <form onSubmit={handleLogin} className="space-y-3">
                        <Input
                          type="email"
                          placeholder="Email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          disabled={authLoading}
                        />
                        <Input
                          type="password"
                          placeholder="Password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          disabled={authLoading}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" disabled={authLoading} className="flex-1">
                            {authLoading ? "Logging in..." : isSignup ? "Sign Up" : "Login"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowLoginForm(false)
                              setIsSignup(false)
                              setLoginEmail("")
                              setLoginPassword("")
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => setIsSignup(!isSignup)}
                          className="w-full"
                        >
                          {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
                        </Button>
                      </form>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Logged in as:</p>
                      <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Sync</Label>
                        <p className="text-sm text-muted-foreground">Sync your data automatically</p>
                      </div>
                      <Switch
                        checked={autoSync}
                        onCheckedChange={(checked) => handlePreferenceUpdate("autoSync", checked)}
                        className="data-[state=unchecked]:bg-gray-500"
                      />
                    </div>

                    {lastSyncTime && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Last Synced:</p>
                        <div className="flex gap-2">
                          <p className="text-sm text-muted-foreground">
                            {new Date(lastSyncTime).toUTCString().split(" ").slice(0, 4).join(" ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(lastSyncTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <div className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-muted-foreground">{isOnline ? "Online" : "Offline"}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleManualSync}
                        disabled={isSyncing || isRestoring || !isOnline}
                        variant="outline"
                        className="flex-1 bg-transparent"
                      >
                        <Cloud className="h-4 w-4 mr-0.5" />
                        {isSyncing ? "Syncing..." : "Sync Now"}
                      </Button>
                      <Button
                        onClick={handleRestore}
                        disabled={isSyncing || isRestoring || !isOnline}
                        variant="outline"
                        className="flex-1 bg-transparent"
                      >
                        <CloudDownload className="h-4 w-4 mr-0.5" />
                        {isRestoring ? "Restoring..." : "Restore"}
                      </Button>
                    </div>

                    <Button onClick={handleLogout} disabled={authLoading} variant="destructive" className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="flex flex-row sm:items-center sm:justify-between max-sm:flex-col gap-3">
            <CardHeader className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency Preferences
              </CardTitle>
              <CardDescription>Set your default currency</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={currency} onValueChange={(value) => handlePreferenceUpdate("currency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rs">Rupees (Rs)</SelectItem>
                  <SelectItem value="$">USD ($)</SelectItem>
                  <SelectItem value="€">EUR (€)</SelectItem>
                  <SelectItem value="£">GBP (£)</SelectItem>
                  <SelectItem value="¥">JPY (¥)</SelectItem>
                  <SelectItem value="C$">CAD (C$)</SelectItem>
                  <SelectItem value="A$">AUD (A$)</SelectItem>
                </SelectContent>
              </Select>         
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <RefreshCwIcon className="h-5 w-5" />
                Carry Over Preferences
              </CardTitle>
              <CardDescription>Set your carry over preference for balance carry over from previous month</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className={`flex items-center gap-2 max-sm:gap-1`}>
                <Label htmlFor="carry-over-preference" className="text-sm font-medium whitespace-nowrap">
                  Carry Over Preference
                </Label>
                <Select value={carryOver} onValueChange={(value) => {setCarryOver(value); localStorage.setItem("carryOver", value)}}>
                  <SelectTrigger id="carry-over-preference">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="ad">AD calendar</SelectItem>
                    <SelectItem value="bs">BS calendar</SelectItem>
                  </SelectContent>
                </Select>    
              </div>
              <div className={`flex items-center gap-2 max-sm:gap-1`}>
                <Label htmlFor="carry-over-account" className="text-sm font-medium whitespace-nowrap">
                  Carry Over Account
                </Label>
                <Select value={carryOverAccount} onValueChange={(value) => {setCarryOverAccount(value); localStorage.setItem("carryOverAccount", value)}}>
                  <SelectTrigger id="carry-over-account">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => { 
                      return (
                        <SelectItem key={acc.id} value={acc.id}>
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-center font-bold overflow-hidden">{acc.icon}</span>
                            <span>{acc.name}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>    
              </div>      
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Manage your financial data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Export Data</Label>
                <div className="text-sm text-muted-foreground sm:flex sm:gap-2">
                  <p>Download your transaction history</p>
                  <p>({filteredTransactions.length} transaction{filteredTransactions.length === 1 ? "" : "s"})</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 -mt-2">
                <div className="flex max-md:flex-col gap-2 sm:gap-3">
                {/* Calendar Toggle */}
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-medium whitespace-nowrap">
                      Calendar
                    </Label>
                    <div className="flex items-center space-x-2 bg-background px-3 py-2 rounded-md border">
                      <Label htmlFor="calendar-toggle" className="text-sm whitespace-nowrap cursor-pointer">
                        AD
                      </Label>
                      <Switch
                        id="calendar-toggle"
                        checked={useBSDate}
                        onCheckedChange={(checked) => {setUseBSDate(checked); localStorage.setItem("useBSDateExport", checked.toString())}}
                      />
                      <Label htmlFor="calendar-toggle" className="text-sm whitespace-nowrap cursor-pointer">
                        BS
                      </Label>
                    </div>
                  </div>
                  
                  {/* Date Filters */}
                  <div className="flex gap-3">
                    {/* Year Filter */}
                    <div className="flex items-center gap-1">
                      <Label htmlFor="year-filter" className="text-sm font-medium whitespace-nowrap">
                        Year
                      </Label>
                      <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger id="year-filter" className="w-[90px] bg-background border-border shadow-none">
                          <SelectValue placeholder={`${useBSDate ? 'BS' : 'AD'} Year`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {yearOptions.map((y) => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Month Filter */}
                    <div className="flex items-center gap-1">
                      <Label htmlFor="month-filter" className="text-sm font-medium whitespace-nowrap">
                        Month
                      </Label>
                      <Select value={filterMonth} onValueChange={setFilterMonth}>
                        <SelectTrigger id="month-filter" className="w-[115px] bg-background border-border shadow-none">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {monthOptions.map((m, i) => (
                            <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportData("csv")} disabled={isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportData("txt")} disabled={isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    Export TXT
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-destructive">Danger Zone</Label>
                <p className="text-sm text-muted-foreground">Permanently delete all your data</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleClearAllData}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </CardContent>
          </Card>

          <ReportGenerator transactions={filteredTransactions} />
          
          <Card id="accountManager">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Custom Accounts
              </CardTitle>
              <CardDescription>Manage your custom accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newAccountIcon}
                  onChange={(e) => setNewAccountIcon(e.target.value)}
                  placeholder="Icon"
                  className="flex-1"
                  autoComplete="nope"
                />
                <Input
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Account name"
                  className="flex-4"
                  autoComplete="nope"
                />
                <Button onClick={handleAddAccount} size="sm">
                  {isAddingCategory ? "Adding..." : "Add"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Your Custom Accounts</Label>
                {customAccounts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No custom accounts found</p>
                ) : (
                  <div className="space-y-2 overflow-auto max-h-[200px]">
                    {customAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className={`flex items-center justify-between p-2 border rounded border-gray-400`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-sm w-5 text-center font-bold overflow-hidden">{acc.icon}</span>
                          <span className="text-sm font-medium">{acc.name}</span>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccount(acc.id, acc.name)}
                          className="hover:bg-red-500"
                        >
                          <Trash2 className="h-4 w-4 hover:text-white" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card id="categoryManager">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Custom Categories
              </CardTitle>
              <CardDescription>Manage your custom expense and income categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={categoryType}
                onValueChange={(value) => {
                  setCategoryType(value as "expense" | "income")
                  setNewCategoryName("")
                  setNewCategoryIcon("")
                }}
              >
                <TabsList className="grid w-full grid-cols-2 gap-1">
                  <TabsTrigger value="expense" className="bg-gray-300 data-[state=active]:text-white data-[state=active]:bg-red-600">
                    Expense
                  </TabsTrigger>
                  <TabsTrigger value="income" className="bg-gray-300 data-[state=active]:text-white data-[state=active]:bg-green-600">
                    Income
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex gap-2">
                <Input
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  placeholder="Icon"
                  className="flex-1"
                  autoComplete="nope"
                />
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flex-4"
                  autoComplete="nope"
                />
                <Button onClick={handleAddCategory} size="sm">
                  {isAddingCategory ? "Adding..." : "Add"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Your Custom Categories</Label>
                {customCategories.filter((category) => category.type === categoryType).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No custom categories in this category type</p>
                ) : (
                  <div className="space-y-2 overflow-auto max-h-[200px]">
                    {customCategories.filter((category) => category.type === categoryType).map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-center justify-between p-2 border rounded
                          ${category.type === "income" ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-sm w-5 text-center font-bold overflow-hidden">{category.icon}</span>
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <span
                            className={`px-1 text-xs ${
                              category.type === "income" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {category.type === "income" ? "Income" : "Expense"}
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="hover:bg-red-500"
                        >
                          <Trash2 className="h-4 w-4 hover:text-white" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                About
              </CardTitle>
              <CardDescription>Application information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-bold">Storage</Label>
                <p className="text-sm text-muted-foreground">
                  Data is stored locally in your device with optional cloud backup
                </p>
              </div>
              <div>
                <Label className="text-sm font-bold">Developer</Label>
                <p className="text-sm text-muted-foreground">Rimesh Bir Singh</p>
                <p className="text-sm text-muted-foreground">Contact: developer2061@outlook.com</p>
              </div>
              <div>
                <Label className="text-sm font-bold">App Version</Label>
                <p className="text-sm text-muted-foreground">v1.0.0</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
