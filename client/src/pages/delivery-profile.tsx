import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Phone, Mail, MapPin, Calendar, Briefcase, ChevronRight, UserCircle2, ShieldCheck, Wallet, Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function DeliveryProfile() {
    const { employee, signOut } = useAuth();

    const { data: response, isLoading } = useQuery({
        queryKey: ['deliveries', 'me', 'history'],
    });

    const stats = (response as any)?.data?.earnings;

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            {/* Header/Banner Section */}
            <div className="bg-white px-6 py-8 border-b border-slate-100 shadow-sm">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                            {employee?.profileImage ? (
                                <img src={employee.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle2 className="w-16 h-16 text-slate-300" strokeWidth={1} />
                            )}
                        </div>
                        <div className="absolute bottom-0 right-1 bg-emerald-500 p-1.5 rounded-full border-2 border-white shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{employee?.fullName}</h1>
                        <p className="text-sm font-medium text-blue-600 capitalize bg-blue-50 px-3 py-1 rounded-full inline-block">
                            {employee?.position || employee?.role || 'Delivery Partner'}
                        </p>
                    </div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest pt-1">
                        ID: {employee?.employeeId?.replace('FZCE', '') || 'N/A'}
                    </p>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-6 mt-2">

                {/* Performance Stats Dashboard */}
                <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">This Month</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/50 flex flex-col items-center justify-center space-y-2">
                            <div className="bg-emerald-50 text-emerald-600 w-10 h-10 rounded-full flex items-center justify-center">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-slate-800">
                                    ₹{stats?.totalEarnings?.toLocaleString('en-IN') || '0'}
                                </p>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Earnings</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/50 flex flex-col items-center justify-center space-y-2">
                            <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center">
                                <Package className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-slate-800">
                                    {stats?.totalDeliveries || '0'}
                                </p>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Deliveries</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Account Details</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100/50 overflow-hidden">
                        <div className="flex items-center gap-3 p-4">
                            <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {employee?.phone || 'Not provided'}
                                </p>
                                <p className="text-xs text-slate-500">Phone</p>
                            </div>
                        </div>
                        <Separator className="bg-slate-50 ml-12" />

                        <div className="flex items-center gap-3 p-4">
                            <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {employee?.email || 'Not provided'}
                                </p>
                                <p className="text-xs text-slate-500">Email</p>
                            </div>
                        </div>
                        <Separator className="bg-slate-50 ml-12" />

                        <div className="flex items-center gap-3 p-4">
                            <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {employee?.department || 'Operations'}
                                </p>
                                <p className="text-xs text-slate-500">Department</p>
                            </div>
                        </div>

                        {employee?.hireDate && (
                            <>
                                <Separator className="bg-slate-50 ml-12" />
                                <div className="flex items-center gap-3 p-4">
                                    <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {new Date(employee.hireDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', day: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-slate-500">Joined</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {employee?.address && (
                            <>
                                <Separator className="bg-slate-50 ml-12" />
                                <div className="flex items-center gap-3 p-4">
                                    <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 leading-snug">
                                            {employee.address}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">Address</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        variant="ghost"
                        className="w-full bg-white text-red-600 border border-red-100 shadow-sm hover:bg-red-50 hover:text-red-700 font-semibold h-14 rounded-xl flex items-center justify-between px-6"
                        onClick={() => signOut()}
                    >
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5" />
                            <span>Log Out</span>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-40" />
                    </Button>
                </div>

                <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest pt-2">
                    FabZClean Portal v1.0
                </p>
            </div>
        </div>
    );
}
