"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { format, subMonths, startOfMonth, isSameMonth, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Wallet, LockIcon } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { supabase } from "@/lib/supabase"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "hsl(var(--muted-foreground))"]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUserAndData() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data, error } = await supabase
          .from("transactions")
          .select("*, categories(name)")
          .eq("user_id", session.user.id)
          .order("transaction_date", { ascending: false })

        if (!error && data) {
          setTransactions(data)
        }
      }
      setLoading(false)
    }

    getUserAndData()
  }, [])

  const kpis = useMemo(() => {
    let income = 0
    let expense = 0

    transactions.forEach(tx => {
      const amt = Number(tx.amount) || 0
      if (tx.type === 'income') {
        income += amt
      } else if (tx.type === 'expense') {
        expense += Math.abs(amt)
      }
    })

    return {
      totalIncome: income,
      totalExpense: expense,
      netSavings: income - expense,
      // Fallback budget used calculation (expenses as % of income, capped at 100)
      budgetUsed: income > 0 ? Math.min(Math.round((expense / income) * 100), 100) : 0
    }
  }, [transactions])

  const lineChartData = useMemo(() => {
    const data = []
    const now = new Date()

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i)
      const monthName = format(d, "MMM")
      
      let mIncome = 0
      let mExpense = 0

      transactions.forEach(tx => {
        const txDate = parseISO(tx.transaction_date)
        if (isSameMonth(txDate, d)) {
          const amt = Number(tx.amount) || 0
          if (tx.type === 'income') {
            mIncome += amt
          } else {
            mExpense += Math.abs(amt)
          }
        }
      })

      data.push({
        name: monthName,
        income: mIncome,
        expense: mExpense
      })
    }
    return data
  }, [transactions])

  const pieChartData = useMemo(() => {
    const now = new Date()
    const categoryTotals: Record<string, number> = {}

    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        const txDate = parseISO(tx.transaction_date)
        if (isSameMonth(txDate, now)) {
          const amt = Math.abs(Number(tx.amount) || 0)
          const catName = tx.categories?.name || "Uncategorized"
          categoryTotals[catName] = (categoryTotals[catName] || 0) + amt
        }
      }
    })

    const data = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    
    return data.length > 0 ? data : [{ name: "No Data", value: 1 }]
  }, [transactions])

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5)
  }, [transactions])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-5 w-[300px] mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-[400px] col-span-4 rounded-xl" />
          <Skeleton className="h-[400px] col-span-3 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 bg-muted p-3 rounded-full w-fit">
              <LockIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to view your financial dashboard and data.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/login" className={buttonVariants({ variant: "default" })}>
              Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Here is an overview of your finances.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.totalIncome.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.totalExpense.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.netSavings.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Est. Budget Used</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.budgetUsed}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div 
                className={`h-2 rounded-full ${kpis.budgetUsed > 90 ? 'bg-rose-500' : 'bg-primary'}`} 
                style={{ width: `${kpis.budgetUsed}%` }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Income vs Expense over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "var(--radius)" }} 
                  itemStyle={{ color: "var(--foreground)" }}
                  labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                />
                <Line type="monotone" dataKey="income" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>This month&apos;s expenses breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {pieChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === "No Data" ? "hsl(var(--muted))" : COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "var(--radius)" }}
                  itemStyle={{ color: "var(--foreground)" }}
                  formatter={(value: any) => Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No transactions found. Add some to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => {
                const amount = Number(transaction.amount) || 0
                const isIncome = transaction.type === 'income'
                
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-medium">{transaction.remarks}</span>
                      <span className="text-sm text-muted-foreground">
                        {transaction.categories?.name || "Uncategorized"} • {format(parseISO(transaction.transaction_date), "PPP")}
                      </span>
                    </div>
                    <div className={`font-bold tabular-nums ${isIncome ? "text-emerald-500" : "text-foreground"}`}>
                      {isIncome ? "+" : "-"}{Math.abs(amount).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
