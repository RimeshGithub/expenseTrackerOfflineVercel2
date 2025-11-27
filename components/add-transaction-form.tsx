"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTransactions } from "@/hooks/use-transactions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCategories } from "@/hooks/use-categories"
import { useAccounts } from "@/hooks/use-accounts"
import { Loader2, Plus } from "lucide-react"
import { format, set } from "date-fns"
import DatePicker from '@sbmdkl/nepali-datepicker-reactjs'
import '@sbmdkl/nepali-datepicker-reactjs/dist/index.css'
import NepaliDate from "nepali-date-converter"
import { getCurrency } from "@/hooks/use-currency"

export function AddTransactionForm() {
  const { addTransaction } = useTransactions()
  const { expenseCategories, incomeCategories } = useCategories()
  const { accounts } = useAccounts()

  const [type, setType] = useState<"expense" | "income">("expense")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [account, setAccount] = useState("cash")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const categories = type === "expense" ? expenseCategories : incomeCategories
  const bs = date ? new NepaliDate(new Date(date)).getBS() : ""

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!amount || !category || !date || !account) {
      setError("Please fill in all fields")
      return
    }

    if (Number.parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0")
      return
    }

    setLoading(true)

    try {
      await addTransaction({
        type,
        amount: Number.parseFloat(amount),
        account,
        category,
        description,
        date,
      })

      setSuccess("Transaction added successfully!")

      // Reset form
      setAmount("")
      setCategory("")
      setDescription("")
      setDate(format(new Date(), "yyyy-MM-dd"))

      setTimeout(() => {
        setSuccess("")
      }, 2000)
    } catch (error: any) {
      setError(error.message || "Failed to add transaction")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-80 max-w-3xl">
      <CardHeader>
        <CardTitle>New Transaction</CardTitle>
        <CardDescription>Add a new income or expense to track your finances</CardDescription>
      </CardHeader>
      <CardContent className="max-sm:px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Transaction Type */}
          <Tabs
            value={type}
            onValueChange={(value) => {
              setType(value as "expense" | "income")
              setCategory("") // Reset category when type changes
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

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({getCurrency()})</Label>
            <Input
              id="amount"
              type="number"
              autoComplete="off"
              onWheel={(e) => e.target.blur()}
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              className="shadow-sm rounded-md p-2.5 bg-white"
            />
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>

            <div className="flex gap-3">
              <Select
                value={account}        
                onValueChange={(val) => {
                  if (!val) {
                    setAccount("")
                    return
                  }

                  const selected = accounts.find(a => a.id === val)
                  if (selected) {
                    setAccount(val)
                  }
                }}
              >
                <SelectTrigger className="shadow-sm rounded-md p-2.5 bg-white">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>

                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-bold overflow-hidden">{acc.icon}</span>
                        <span>{acc.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => router.push("/dashboard/settings#accountManager")} variant="outline" className="rounded-full h-9 w-9"><Plus className="w-4 h-4 scale-125" /></Button>
            </div>
          </div>
  
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>

            <div className="flex gap-3">
              <Select
                value={category}
                onValueChange={(val) => {
                  if (!val) {
                    setCategory("")
                    return
                  }

                  const selected = categories.find(c => c.id === val)
                  if (selected) {
                    setCategory(val)
                  }  
                }}
              >
                <SelectTrigger className="shadow-sm rounded-md p-2.5 bg-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>

                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-bold overflow-hidden">{cat.icon}</span>
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => router.push("/dashboard/settings#categoryManager")} variant="outline" className="rounded-full h-9 w-9"><Plus className="w-4 h-4 scale-125" /></Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter transaction description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoComplete="nope"
              disabled={loading}
              rows={3}
              className="shadow-sm rounded-md p-2.5 bg-white"
            />
          </div>

          {/* Date */}
          <div className="space-y-2 text-xs">
            <Label htmlFor="date">Date</Label>

            <div className="flex gap-2 items-center max-md:flex-col max-md:items-start" id="date">
              <label className="flex gap-1 items-center">
                AD:
                <Input 
                  type="date"
                  value={date}
                  required
                  onChange={(e) => setDate(e.target.value)}
                  className="w-75 shadow-sm rounded-md p-2.5 mr-2 bg-white"
                />
              </label>
              
              <label className="flex gap-1 items-center">
                BS:
                <div onClick={() => !date && setDate(format(new Date(), "yyyy-MM-dd"))}>
                  <DatePicker               
                    key={`${bs.year}-${bs.month}-${bs.date}`} 
                    inputClassName="form-control"
                    className="shadow-sm rounded-md px-2.5 py-1.5 w-75 cursor-default bg-white"
                    defaultDate={`${bs.year}-${String(bs.month + 1).padStart(2, '0')}-${String(bs.date).padStart(2, '0')}`}
                    onChange={(newDate) => setDate(newDate.adDate)}
                    options={{ calenderLocale: 'ne', valueLocale: 'en' }}
                    hideDefaultValue={!date}
                  />
                </div>  
              </label>           
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </>
              )}
            </Button>
            {/* <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={loading}>
              Cancel
            </Button> */}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
