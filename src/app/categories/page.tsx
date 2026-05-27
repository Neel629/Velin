/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Tag, DownloadIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCategories, addCategory, deleteCategory } from "@/lib/store"
import { downloadCategoriesCSV } from "@/lib/export"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const [name, setName] = useState("")
  const [type, setType] = useState("expense")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const data = await getCategories()
      setCategories(data || [])
    } catch (error: any) {
      toast.error("Failed to load categories", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Category name is required.")
      return
    }

    try {
      await addCategory({
        name: name.trim(),
        type,
      })

      toast.success("Category added successfully")
      setName("")
      fetchData()
    } catch (error: any) {
      toast.error("Failed to add category", { description: error.message })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id)
      toast.success("Category deleted")
      fetchData()
    } catch (error: any) {
      toast.error("Failed to delete category", { description: error.message })
    }
  }


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">Manage your custom income and expense categories.</p>
        </div>
        <Button onClick={downloadCategoriesCSV} variant="outline" className="shrink-0">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading categories...</p>
          ) : categories.length === 0 ? (
            <div className="border rounded-lg p-8 text-center bg-card">
              <Tag className="mx-auto h-8 w-8 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-medium text-lg">No categories yet</h3>
              <p className="text-muted-foreground">Create one using the form.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((cat) => (
                <Card key={cat.id}>
                  <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${cat.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {cat.name}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add Category</CardTitle>
              <CardDescription>Create a new tag for tracking.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Travel, Salary" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={(val) => setType(val || 'expense')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
