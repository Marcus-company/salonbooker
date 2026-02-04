import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./components/LogoutButton";

// Force dynamic rendering for auth
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const userRole = session.user.user_metadata?.role || "staff";
  const userName = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Gebruiker";
  const userEmail = session.user.email || "";

  // Define nav items based on role
  const navItems = [
    ...(userRole === "admin" ? [{ href: "/admin", label: "Dashboard", icon: "📊" }] : []),
    { href: "/admin/bookingen", label: "Boekingen", icon: "📋" },
    { href: "/admin/kalender", label: "Kalender", icon: "📅" },
    ...(userRole === "admin" ? [{ href: "/admin/medewerkers", label: "Medewerkers", icon: "👥" }] : []),
    ...(userRole === "admin" ? [{ href: "/admin/analytics", label: "Analytics", icon: "📈" }] : []),
    ...(userRole === "admin" ? [{ href: "/admin/instellingen", label: "Instellingen", icon: "⚙️" }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">SalonBooker</h1>
          <p className="text-sm text-slate-500">HairsalonX Admin</p>
          {userRole === "admin" && (
            <span className="mt-2 inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
              Admin
            </span>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{userName}</p>
              <p className="text-sm text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
