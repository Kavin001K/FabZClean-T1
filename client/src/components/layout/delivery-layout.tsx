import React, { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Package, History, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface DeliveryLayoutProps {
    children: ReactNode;
}

export function DeliveryLayout({ children }: DeliveryLayoutProps) {
    const [location] = useLocation();
    const { signOut } = useAuth();

    const navItems = [
        { href: "/delivery-home", icon: Package, label: "Active" },
        { href: "/delivery-history", icon: History, label: "History" },
        { href: "/delivery-profile", icon: User, label: "Profile" },
    ];

    return (
        <div className="flex flex-col min-h-[100dvh] bg-slate-50">
            <main className="flex-1 overflow-y-auto pb-20">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around p-2 z-50 pb-safe">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <a className={`flex flex-col items-center p-2 rounded-lg min-w-[64px] transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>
                                <Icon className={`h-6 w-6 ${isActive ? 'fill-blue-50' : ''}`} />
                                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                            </a>
                        </Link>
                    );
                })}
                <button
                    onClick={() => signOut()}
                    className="flex flex-col items-center p-2 rounded-lg min-w-[64px] text-red-500 hover:text-red-600 transition-colors"
                >
                    <LogOut className="h-6 w-6" />
                    <span className="text-[10px] mt-1 font-medium">Logout</span>
                </button>
            </nav>
        </div>
    );
}
