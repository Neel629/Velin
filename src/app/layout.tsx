import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Velin - Expense Tracker",
  description: "Personal and group expense tracking dashboard.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <div className="flex flex-col flex-1 min-h-screen">
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
                  <SidebarTrigger />
                  <div className="flex-1 max-w-md ml-auto sm:ml-0 relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search transactions..."
                      className="w-full bg-background pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                    />
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <ThemeToggle />
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src="/placeholder-avatar.jpg" alt="@user" />
                      <AvatarFallback>UN</AvatarFallback>
                    </Avatar>
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-6 md:p-8">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
