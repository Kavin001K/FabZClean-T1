/**
 * GLOBAL SHORTCUTS PROVIDER
 * Provides keyboard shortcuts functionality throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ShortcutsDialog } from './shortcuts-dialog';
import { useToast } from '@/hooks/use-toast';

interface ShortcutsContextType {
    showShortcuts: () => void;
    hideShortcuts: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null);

export function useShortcuts() {
    const context = useContext(ShortcutsContext);
    if (!context) {
        throw new Error('useShortcuts must be used within ShortcutsProvider');
    }
    return context;
}

interface ShortcutsProviderProps {
    children: React.ReactNode;
}

export function ShortcutsProvider({ children }: ShortcutsProviderProps) {
    const [showDialog, setShowDialog] = useState(false);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Handle global keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Skip if typing in input/textarea (except for F-keys and Escape)
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable;

        // Allow F-keys and Escape to work even when in inputs
        if (isInput && e.key && !e.key.startsWith('F') && e.key !== 'Escape') {
            return;
        }

        // F1 - Help / Shortcuts
        if (e.key === 'F1') {
            e.preventDefault();
            setShowDialog(true);
            return;
        }

        // F2 or Ctrl+N - New Order
        if (e.key === 'F2' || (e.ctrlKey && e.key.toLowerCase() === 'n')) {
            e.preventDefault();
            setLocation('/create-order');
            toast({
                title: '📝 New Order',
                description: 'Opening order creation page...',
                duration: 1500,
            });
            return;
        }

        // F3 or Ctrl+F - Quick Search
        if (e.key === 'F3' || (e.ctrlKey && e.key.toLowerCase() === 'f')) {
            e.preventDefault();
            // Focus on search input if exists
            const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            } else {
                toast({
                    title: '🔍 Search',
                    description: 'Use the search bar at the top of the page',
                    duration: 2000,
                });
            }
            return;
        }

        // F4 - Dashboard
        if (e.key === 'F4') {
            e.preventDefault();
            setLocation('/dashboard');
            return;
        }

        // F5 - Refresh (allow default browser behavior)
        // Don't prevent default for F5

        // F9 or Ctrl+P - Print
        if (e.key === 'F9' || (e.ctrlKey && e.key.toLowerCase() === 'p')) {
            e.preventDefault();
            // Trigger print if on order details page
            const printBtn = document.querySelector('[data-print-button]') as HTMLButtonElement;
            if (printBtn) {
                printBtn.click();
            } else {
                toast({
                    title: '🖨️ Print',
                    description: 'Open an order to print the bill',
                    duration: 2000,
                });
            }
            return;
        }

        // Ctrl+S - Save
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            const saveBtn = document.querySelector('[data-save-button]') as HTMLButtonElement;
            if (saveBtn) {
                saveBtn.click();
            } else {
                toast({
                    title: '💾 Save',
                    description: 'No form to save on this page',
                    duration: 2000,
                });
            }
            return;
        }

        // Escape - Close dialogs or go back
        if (e.key === 'Escape') {
            // Close shortcuts dialog if open
            if (showDialog) {
                setShowDialog(false);
                return;
            }

            // Close any open dialog
            const closeBtn = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
            if (closeBtn) {
                e.preventDefault();
                closeBtn.click();
                return;
            }
        }

        // Alt+1 - Orders
        if (e.altKey && e.key === '1') {
            e.preventDefault();
            setLocation('/orders');
            return;
        }

        // Alt+2 - Customers
        if (e.altKey && e.key === '2') {
            e.preventDefault();
            setLocation('/customers');
            return;
        }

        // Alt+3 - Services
        if (e.altKey && e.key === '3') {
            e.preventDefault();
            setLocation('/services');
            return;
        }

        // Alt+4 - Reports
        if (e.altKey && e.key === '4') {
            e.preventDefault();
            setLocation('/reports');
            return;
        }

        // Alt+5 - Employees
        if (e.altKey && e.key === '5') {
            e.preventDefault();
            setLocation('/employees');
            return;
        }
    }, [setLocation, toast, showDialog]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Show initial toast about shortcuts on first visit
    useEffect(() => {
        const hasShownTip = sessionStorage.getItem('shortcuts_tip_shown');
        if (!hasShownTip) {
            setTimeout(() => {
                toast({
                    title: '⌨️ Keyboard Shortcuts',
                    description: 'Press F1 for shortcuts. F2 to create order quickly!',
                    duration: 5000,
                });
                sessionStorage.setItem('shortcuts_tip_shown', 'true');
            }, 2000);
        }
    }, [toast]);

    const value = {
        showShortcuts: () => setShowDialog(true),
        hideShortcuts: () => setShowDialog(false),
    };

    return (
        <ShortcutsContext.Provider value={value}>
            {children}
            <ShortcutsDialog open={showDialog} onOpenChange={setShowDialog} />
        </ShortcutsContext.Provider>
    );
}

export default ShortcutsProvider;
