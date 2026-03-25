import React, { useEffect } from 'react';
import EmployeeManagement from '@/components/employee-management';
import { PageTransition } from '@/components/ui/page-transition';

export default function UserManagementPage() {
    useEffect(() => {
        document.title = "User Management | FabzClean";
    }, []);

    return (
        <PageTransition>
            <div className="container-desktop min-h-screen py-4 sm:py-8">
                <EmployeeManagement />
            </div>
        </PageTransition>
    );
}
