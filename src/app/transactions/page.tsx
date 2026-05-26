/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { TransactionForm, TransactionFormValues } from "@/components/transaction-form"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchData(session.user.id)
      } else {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  async function fetchData(userId: string) {
    setLoading(true)
    try {
      const [txRes, catRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("*, categories(name)")
          .eq("user_id", userId)
          .order("transaction_date", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", userId),
      ])

      if (txRes.error) throw txRes.error
      if (catRes.error) throw catRes.error

      setTransactions(txRes.data || [])
      setCategories(catRes.data || [])
    } catch (error: any) {
      toast.error("Failed to load data", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTransaction(values: TransactionFormValues) {
    if (!user) {
      toast.error("You must be logged in to add a transaction.")
      return
    }

    try {
      const totalAmount = values.amount * values.quantity
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: values.type,
        remarks: values.remarks,
        amount: values.amount,
        quantity: values.quantity,
        total_amount: totalAmount,
        transaction_date: values.transaction_date.toISOString(),
        category_id: values.category_id !== "none" ? values.category_id : null,
      })

      if (error) throw error

      toast.success("Transaction added successfully")
      setOpen(false)
      fetchData(user.id)
    } catch (error: any) {
      toast.error("Failed to add transaction", { description: error.message })
    }
  }

  async function handleDelete(id: string) {
    if (!user) return
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id)
      if (error) throw error
      toast.success("Transaction deleted")
      fetchData(user.id)
    } catch (error: any) {
      toast.error("Failed to delete transaction", { description: error.message })
    }
  }

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">Authentication Required</h2>
        <p className="text-muted-foreground">Please sign in to view and manage transactions.</p>
        <Link href="/login" className={buttonVariants()}>Sign In</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">Manage your income and expenses.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" /> Add Entry
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>
                Enter the details of your transaction below.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm onSubmit={handleAddTransaction} categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">Loading transactions...</TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No transactions found. Click &quot;Add Entry&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(tx.transaction_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{tx.remarks}</TableCell>
                  <TableCell>{tx.categories?.name || "-"}</TableCell>
                  <TableCell>{tx.quantity}</TableCell>
                  <TableCell className={`text-right font-bold tabular-nums ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
