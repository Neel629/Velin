"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"

const memberSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  amount: z.coerce.number().min(0, { message: "Amount must be positive." }),
})

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  total_amount: z.coerce.number().positive({ message: "Total amount must be positive." }),
  event_date: z.date(),
  notes: z.string().optional(),
  members: z.array(memberSchema).min(1, { message: "At least one member is required." }),
})

export type SplitGroupFormValues = z.infer<typeof formSchema>

interface SplitGroupFormProps {
  onSubmit: (data: SplitGroupFormValues) => void
  isSubmitting?: boolean
}

export function SplitGroupForm({ onSubmit, isSubmitting }: SplitGroupFormProps) {
  const form = useForm<SplitGroupFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      total_amount: 0,
      event_date: new Date(),
      notes: "",
      members: [{ name: "", amount: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Dinner at Luigi's" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="total_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="event_date"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2.5">
                <FormLabel>Event Date</FormLabel>
                <Popover>
                  <FormControl>
                    <PopoverTrigger
                      render={
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        />
                      }
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </PopoverTrigger>
                  </FormControl>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional details..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base">Members</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", amount: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-4">
              <FormField
                control={form.control}
                name={`members.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className={cn(index !== 0 && "sr-only")}>
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`members.${index}.amount`}
                render={({ field }) => (
                  <FormItem className="w-1/3">
                    <FormLabel className={cn(index !== 0 && "sr-only")}>
                      Amount Owed
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4 text-rose-500" />
              </Button>
            </div>
          ))}
          {form.formState.errors.members?.root && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.members.root.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Split Group"}
        </Button>
      </form>
    </Form>
  )
}
