import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Phone, Mail, MapPin, Calendar, Briefcase, TrendingUp, Loader2, IndianRupee, Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function DeliveryProfile() {
    const { employee, signOut } = useAuth();

    const { data: response, isLoading } = useQuery({
        queryKey: ['/api/deliveries/me/history'],
    });

    const stats = (response as any)?.data?.earnings;

    return (
        <div className="p-4 max-w-md mx-auto space-y-6 pt-6 animate-in fade-in zoom-in-95 duration-300">
            <h1 className="text-2xl font-bold text-center text-slate-800">My Profile</h1>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <CardHeader className="text-center pt-0 px-6 pb-4 relative">
                    <div className="mx-auto bg-white p-1 rounded-full w-24 h-24 flex items-center justify-center -mt-12 mb-3 shadow-md border border-slate-100">
                        {employee?.profileImage ? (
                            <img src={employee.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 text-slate-400" />
                        )}
                    </div>
                    <CardTitle className="text-xl font-bold">{employee?.fullName}</CardTitle>
                    <p className="text-sm font-medium text-blue-600 capitalize">{employee?.position || employee?.role}</p>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{employee?.employeeId}</p>
                </CardHeader>

                <Separator className="bg-slate-100" />

                <CardContent className="space-y-4 pt-6 px-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-md">
                                <Phone className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Phone Number</p>
                                <p className="text-sm text-slate-900 truncate">{employee?.phone || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 p-2 rounded-md">
                                <Mail className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Email Address</p>
                                <p className="text-sm text-slate-900 truncate">{employee?.email || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-50 p-2 rounded-md">
                                <Briefcase className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Department</p>
                                <p className="text-sm text-slate-900 truncate">{employee?.department || 'Operations'}</p>
                            </div>
                        </div>

                        {employee?.hireDate && (
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-50 p-2 rounded-md">
                                    <Calendar className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Joined Date</p>
                                    <p className="text-sm text-slate-900 truncate">
                                        {new Date(employee.hireDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {employee?.address && (
                            <div className="flex items-start gap-3 pt-2">
                                <div className="bg-rose-50 p-2 rounded-md mt-0.5">
                                    <MapPin className="w-4 h-4 text-rose-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Address</p>
                                    <p className="text-sm text-slate-900 leading-relaxed">{employee.address}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3 p-4">
                    <CardTitle className="text-sm font-bold flex items-center text-slate-800">
                        <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" />
                        This Month's Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                                <div className="flex justify-center mb-1">
                                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                                </div>
                                <p className="text-2xl font-black text-emerald-700">
                                    {stats?.totalEarnings?.toLocaleString('en-IN') || '0'}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 mt-1">Earnings</p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                                <div className="flex justify-center mb-1">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-2xl font-black text-blue-700">
                                    {stats?.totalDeliveries || '0'}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 mt-1">Deliveries</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-medium h-12"
                onClick={() => signOut()}
            >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
            </Button>

            <p className="text-center text-xs text-slate-400 mt-8 mb-4">
                FabZClean Delivery Portal v1.0
            </p>
        </div>
    );
}
