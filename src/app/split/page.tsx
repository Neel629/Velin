"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { Plus, Users, LockIcon, CheckCircle2, Circle, DownloadIcon } from "lucide-react"

import { getSplitGroups, addSplitGroup, updateSplitMemberStatus } from "@/lib/store"
import { downloadSplitsCSV } from "@/lib/export"
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
import { SplitGroupForm, SplitGroupFormValues } from "@/components/split-group-form"

export default function SplitExpensesPage() {
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const data = getSplitGroups()
      setGroups(data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateGroup(data: SplitGroupFormValues) {
    setIsSubmitting(true)
    try {
      // 1. Insert the Split Group and Members
      addSplitGroup({
        title: data.title,
        total_amount: data.total_amount,
        event_date: data.event_date.toISOString().split("T")[0],
        notes: data.notes || null
      }, data.members.map(m => ({
        member_name: m.name,
        owed_amount: m.amount,
        status: 'pending'
      })))

      toast.success("Split group created successfully")
      setOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleSettle(memberId: string, currentStatus: string) {
    const newStatus = currentStatus === 'pending' ? 'settled' : 'pending'
    try {
      updateSplitMemberStatus(memberId, newStatus)
      
      toast.success(`Member marked as ${newStatus}`)
      // Optimistic UI update
      setGroups(prev => prev.map(group => ({
        ...group,
        split_members: group.split_members.map((m: any) => 
          m.id === memberId ? { ...m, status: newStatus } : m
        )
      })))
    } catch (error: any) {
      toast.error(error.message)
    }
  }

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Split Expenses</h2>
          <p className="text-muted-foreground">Manage group trips and shared bills.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={downloadSplitsCSV} variant="outline" className="shrink-0">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button className="shrink-0">
                <Plus className="mr-2 h-4 w-4" /> New Group
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Split Group</DialogTitle>
                <DialogDescription>
                  Enter the details of your shared expense.
                </DialogDescription>
              </DialogHeader>
              <SplitGroupForm onSubmit={handleCreateGroup} isSubmitting={isSubmitting} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No split groups yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create your first split group to start tracking shared dinners, trips, and bills.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const settledCount = group.split_members?.filter((m: any) => m.status === 'settled').length || 0
            const totalMembers = group.split_members?.length || 0
            const isFullySettled = settledCount === totalMembers && totalMembers > 0

            return (
              <Card key={group.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{group.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {group.event_date ? format(parseISO(group.event_date), "PPP") : ""}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {Number(group.total_amount).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {settledCount}/{totalMembers} settled
                      </div>
                    </div>
                  </div>
                  {group.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">"{group.notes}"</p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="space-y-3 mt-2">
                    {group.split_members?.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{member.member_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {Number(member.owed_amount).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSettle(member.id, member.status)}
                          className={member.status === 'settled' ? 'text-emerald-500 hover:text-emerald-600' : 'text-muted-foreground'}
                        >
                          {member.status === 'settled' ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
                {isFullySettled && (
                  <CardFooter className="pt-0 pb-4">
                    <div className="w-full text-center text-xs font-medium text-emerald-500 bg-emerald-500/10 py-1.5 rounded-md">
                      All settled up!
                    </div>
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
