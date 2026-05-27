"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  category_id: z.string().min(1, { message: "Category is required." }),
  limit_amount: z.coerce.number().positive({ message: "Limit amount must be positive." }),
  period: z.enum(["weekly", "monthly", "yearly"]),
  alert_threshold: z.coerce.number().min(1).max(100),
})

export type BudgetFormValues = z.infer<typeof formSchema>

interface BudgetFormProps {
  categories: any[]
  onSubmit: (data: BudgetFormValues) => void
  isSubmitting?: boolean
}

export function BudgetForm({ categories, onSubmit, isSubmitting }: BudgetFormProps) {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      category_id: "",
      limit_amount: 0,
      period: "monthly",
      alert_threshold: 80,
    },
  })

  // Only show expense categories for budgets
  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="limit_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limit Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="alert_threshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alert Threshold (%)</FormLabel>
              <FormControl>
                <Input type="number" step="1" min="1" max="100" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                We'll highlight the budget when you pass this percentage.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create Budget"}
        </Button>
      </form>
    </Form>
  )
}
