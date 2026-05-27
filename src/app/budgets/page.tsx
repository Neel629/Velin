"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, isWithinInterval, parseISO } from "date-fns"
import { Plus, Target, LockIcon, AlertTriangle, Trash2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { BudgetForm, BudgetFormValues } from "@/components/budget-form"

export default function BudgetsPage() {
  const [user, setUser] = useState<any>(null)
  const [budgets, setBudgets] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function getUserAndData() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchData(session.user.id)
      } else {
        setLoading(false)
      }
    }
    getUserAndData()
  }, [])

  async function fetchData(userId: string) {
    setLoading(true)
    try {
      const startOfYr = startOfYear(new Date()).toISOString()

      const [budgetsRes, categoriesRes, txRes] = await Promise.all([
        supabase
          .from("budgets")
          .select("*, categories(name, color)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", userId),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .eq("type", "expense")
          .gte("transaction_date", startOfYr)
      ])

      if (budgetsRes.error) throw budgetsRes.error
      if (categoriesRes.error) throw categoriesRes.error
      if (txRes.error) throw txRes.error

      setBudgets(budgetsRes.data || [])
      setCategories(categoriesRes.data || [])
      setTransactions(txRes.data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateBudget(data: BudgetFormValues) {
    if (!user) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("budgets")
        .insert([{
          user_id: user.id,
          category_id: data.category_id,
          limit_amount: data.limit_amount,
          period: data.period,
          alert_threshold: data.alert_threshold
        }])

      if (error) throw error

      toast.success("Budget created successfully")
      setOpen(false)
      fetchData(user.id)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this budget?")) return
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", id)
      if (error) throw error
      toast.success("Budget deleted")
      setBudgets(prev => prev.filter(b => b.id !== id))
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const budgetCalculations = useMemo(() => {
    const now = new Date()
    const intervals = {
      weekly: { start: startOfWeek(now), end: endOfWeek(now) },
      monthly: { start: startOfMonth(now), end: endOfMonth(now) },
      yearly: { start: startOfYear(now), end: endOfYear(now) },
    }

    return budgets.map(budget => {
      const interval = intervals[budget.period as keyof typeof intervals]
      
      const spent = transactions
        .filter(tx => tx.category_id === budget.category_id)
        .filter(tx => isWithinInterval(parseISO(tx.transaction_date), interval))
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)

      const limit = Number(budget.limit_amount)
      const percentage = limit > 0 ? (spent / limit) * 100 : 0
      const isAlert = percentage >= Number(budget.alert_threshold)
      const isOver = percentage > 100

      return {
        ...budget,
        spent,
        percentage: Math.min(percentage, 100), // Cap at 100 for progress bar
        isAlert,
        isOver
      }
    })
  }, [budgets, transactions])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-5 w-[300px] mt-2" />
          </div>
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
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
              Please sign in to manage your budgets.
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budgets</h2>
          <p className="text-muted-foreground">Set spending limits and track your progress.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Budget
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Budget</DialogTitle>
              <DialogDescription>
                Set a spending limit for a specific category.
              </DialogDescription>
            </DialogHeader>
            <BudgetForm categories={categories} onSubmit={handleCreateBudget} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No budgets set</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Take control of your spending by setting limits on your highest expense categories.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {budgetCalculations.map((budget) => (
            <Card key={budget.id} className="flex flex-col relative overflow-hidden">
              {budget.isOver && (
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
              )}
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {budget.categories?.name || "Unknown Category"}
                  </CardTitle>
                  <CardDescription className="capitalize mt-1">
                    {budget.period}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(budget.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive -mt-2 -mr-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-2xl font-bold">
                    {budget.spent.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    of {Number(budget.limit_amount).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </div>
                </div>
                
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      budget.isOver ? 'bg-rose-500' : budget.isAlert ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${budget.percentage}%` }}
                  />
                </div>
                
                {budget.isAlert && (
                  <div className={`flex items-center gap-1.5 mt-3 text-xs font-medium ${budget.isOver ? 'text-rose-500' : 'text-amber-500'}`}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {budget.isOver 
                      ? "You have exceeded this budget!" 
                      : `You've used ${Math.round(budget.percentage)}% of your limit.`
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
