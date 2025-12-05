import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import * as LoadingSkeleton from "@/components/ui/loading-skeleton";
import { CheckCircle, Clock, AlertTriangle, Play, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Task {
    id: string;
    title: string;
    description: string;
    employeeId: string; // Corrected from assignedTo
    assignedBy: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    estimatedHours: number;
}

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed': return <CheckCircle className="w-3 h-3 mr-1" />;
        case 'in_progress': return <Play className="w-3 h-3 mr-1" />;
        case 'pending': return <Clock className="w-3 h-3 mr-1" />;
        default: return <Clock className="w-3 h-3 mr-1" />;
    }
};

export default function TasksOverview({ className }: { className?: string }) {
    const { data: tasks, isLoading, isError } = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const res = await fetch('/api/tasks');
            if (!res.ok) throw new Error('Failed to fetch tasks');
            return res.json();
        }
    });

    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const res = await fetch('/api/employees');
            if (!res.ok) return []; // Fallback
            return res.json();
        }
    });

    const getEmployeeName = (id: string) => {
        if (!employees || !Array.isArray(employees)) return id;
        const emp = employees.find((e: any) => e.employeeId === id || e.id === id);
        return emp ? emp.fullName : id;
    };

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Team Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                    <LoadingSkeleton.TableSkeleton rows={3} />
                </CardContent>
            </Card>
        );
    }

    if (isError || !tasks || tasks.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Team Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <p>No active tasks found.</p>
                        <p className="text-sm">Assign tasks to see them here.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Sort by priority/date? 
    const displayTasks = Array.isArray(tasks) ? tasks.slice(0, 5) : [];

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Team Tasks ({tasks.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {displayTasks.map((task: Task) => (
                        <div key={task.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{task.title}</span>
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", getPriorityColor(task.priority))}>
                                        {task.priority}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>To: {getEmployeeName(task.employeeId)}</span>
                                    <span>•</span>
                                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div>
                                <Badge variant="outline" className={cn("text-[10px] capitalize", getStatusColor(task.status))}>
                                    {getStatusIcon(task.status)}
                                    {task.status.replace('_', ' ')}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
