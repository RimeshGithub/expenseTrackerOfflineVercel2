"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, PieChart, Shield, Smartphone } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-3xl md:text-6xl font-bold text-foreground mb-10 flex items-center justify-center gap-5 max-md:gap-2.5 max-md:mt-8">
            <TrendingUp className="h-15 w-15 max-md:h-10 max-md:w-10 text-primary" />
            <span className="font-bold">ExpenseTracker</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-6">
            Track Your <span className="text-primary">Expenses</span> Smartly
          </h1>
          <p className="text-md text-muted-foreground mb-8 max-w-2xl mx-auto">
            Take control of your finances with our modern expense tracker. Categorize spending, visualize trends, and
            achieve your financial goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-md px-8">
              <Link href="/dashboard">Start Tracking</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-5">Why Choose Our Expense Tracker?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Visualize your spending patterns with interactive charts and detailed insights.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <PieChart className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Category Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Organize expenses by categories like food, transport, and entertainment.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Your financial data is stored locally on your device for privacy with secure cloud backup.</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Mobile Friendly</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Access your expenses anywhere with our responsive mobile design.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-6">Ready to Take Control of Your Finances?</h2>
          <p className="text-md text-muted-foreground mb-8">
            Start tracking your expenses and income right now with our easy-to-use dashboard.
          </p>
          <Button asChild size="lg" className="text-md px-8">
            <Link href="/dashboard">Open Dashboard</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
