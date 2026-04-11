import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ShortcutsDialog } from './shortcuts-dialog';
import { useToast } from '@/hooks/use-toast';
import { dispatchShortcutEvent, OPEN_GLOBAL_SEARCH_EVENT, REFRESH_DATA_EVENT } from '@/lib/shortcut-events';

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
    const [location, setLocation] = useLocation();
    const { toast } = useToast();

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable;
        const modKey = e.ctrlKey || e.metaKey;
        const isAltNavigation = e.altKey && ['1', '2', '3', '4'].includes(e.key);
        const isShortcutKey =
            e.key.startsWith('F') ||
            e.key === 'Escape' ||
            modKey ||
            isAltNavigation;

        if (isInput && !isShortcutKey) {
            return;
        }

        if (e.key === 'F1') {
            e.preventDefault();
            setShowDialog(true);
            return;
        }

        if (e.key === 'F2' || (modKey && e.key.toLowerCase() === 'n')) {
            e.preventDefault();
            setLocation('/create-order');
            toast({
                title: 'New Order',
                description: 'Opening order creation page...',
                duration: 1500,
            });
            return;
        }

        if (e.key === 'F3' || (modKey && e.key.toLowerCase() === 'f')) {
            e.preventDefault();
            const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            } else {
                dispatchShortcutEvent(OPEN_GLOBAL_SEARCH_EVENT);
            }
            return;
        }

        if (e.key === 'F4') {
            e.preventDefault();
            setLocation('/dashboard');
            return;
        }

        if (e.key === 'F9' || (modKey && e.key.toLowerCase() === 'p')) {
            e.preventDefault();
            const printBtn = document.querySelector('[data-print-button]') as HTMLButtonElement;
            if (printBtn) {
                printBtn.click();
            } else {
                toast({
                    title: 'Print',
                    description: 'Open an order to print the bill',
                    duration: 2000,
                });
            }
            return;
        }

        if (e.key === 'F5') {
            e.preventDefault();
            const refreshBtn = document.querySelector('[data-refresh-button]') as HTMLButtonElement;
            if (refreshBtn) {
                refreshBtn.click();
                return;
            }

            const wasHandled = dispatchShortcutEvent(REFRESH_DATA_EVENT);
            if (!wasHandled) {
                window.location.reload();
            }
            return;
        }

        if (modKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            const saveBtn = document.querySelector('[data-save-button]') as HTMLButtonElement;
            if (saveBtn) {
                saveBtn.click();
            } else {
                toast({
                    title: 'Save',
                    description: 'No form to save on this page',
                    duration: 2000,
                });
            }
            return;
        }

        if (e.key === 'Escape') {
            if (showDialog) {
                setShowDialog(false);
                return;
            }
            const closeBtn = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
            if (closeBtn) {
                e.preventDefault();
                closeBtn.click();
                return;
            }

            const hasOpenDialog = Boolean(document.querySelector('[role="dialog"][data-state="open"]'));
            const hasOpenPopover = Boolean(document.querySelector('[data-radix-popper-content-wrapper]'));
            if (hasOpenDialog || hasOpenPopover) {
                return;
            }

            if (location !== '/' && location !== '/dashboard') {
                e.preventDefault();
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    setLocation('/dashboard');
                }
            }
            return;
        }

        if (e.altKey && e.key === '1') {
            e.preventDefault();
            setLocation('/orders');
            return;
        }

        if (e.altKey && e.key === '2') {
            e.preventDefault();
            setLocation('/customers');
            return;
        }

        if (e.altKey && e.key === '3') {
            e.preventDefault();
            setLocation('/services');
            return;
        }

        if (e.altKey && e.key === '4') {
            e.preventDefault();
            setLocation('/reports');
            return;
        }

        if (e.altKey && e.key === '5') {
            e.preventDefault();
            setLocation('/employees');
            return;
        }
    }, [location, setLocation, toast, showDialog]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        const hasShownTip = sessionStorage.getItem('shortcuts_tip_shown');
        if (!hasShownTip) {
            const isMac = navigator.platform?.toUpperCase().includes('MAC') || navigator.userAgent?.includes('Mac');
            const modLabel = isMac ? 'Cmd' : 'Ctrl';
            setTimeout(() => {
                toast({
                    title: 'Keyboard Shortcuts',
                    description: `Press F1 for shortcuts. F2 or ${modLabel}+N to create order quickly!`,
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
