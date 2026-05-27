"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { LockIcon, Save, UserIcon } from "lucide-react"

import { getProfile, updateProfile as updateProfileStore, signOut } from "@/lib/store"
import { useRouter } from "next/navigation"
import { downloadCSV } from "@/lib/export"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  
  // Form State
  const [fullName, setFullName] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [themePref, setThemePref] = useState("system")
  
  const { setTheme } = useTheme()

  useEffect(() => {
    async function getProfileData() {
      const data = getProfile()

      if (data) {
        setFullName(data.full_name || "")
        setCurrency(data.default_currency || "INR")
        setThemePref(data.theme_preference || "system")
      }
      setLoading(false)
    }
    getProfileData()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    
    setSaving(true)
    try {
      updateProfileStore({
        full_name: fullName,
        default_currency: currency,
        theme_preference: themePref
      })

      // Update the actual app theme immediately
      setTheme(themePref)
      
      toast.success("Settings saved successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      router.push("/login")
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to sign out")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-5 w-[250px] mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[120px]" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences and app settings.</p>
      </div>

      <Card>
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" /> Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal details and localization preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">


            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="John Doe" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={currency} onValueChange={(val) => setCurrency(val || "INR")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                  <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                  <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                  <SelectItem value="CAD">CAD ($) - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD ($) - Australian Dollar</SelectItem>
                  <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">App Theme</Label>
              <Select value={themePref} onValueChange={(val) => setThemePref(val || "system")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Data Management
          </CardTitle>
          <CardDescription>
            Download your clean data and analytics as a structured CSV report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Your financial data is stored locally on this device. You can export a comprehensive report containing all your analytics, transactions, budgets, and split expenses into a shareable spreadsheet.
            </p>
            <Button onClick={downloadCSV} variant="outline" className="w-fit mt-2">
              Download Analytics & Data Report (.csv)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
            Authentication
          </CardTitle>
          <CardDescription>
            Sign out of your account on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignOut} variant="destructive">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
