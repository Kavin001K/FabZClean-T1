/**
 * ============================================================================
 * POS KEYBOARD SHORTCUTS HOOK
 * ============================================================================
 * 
 * Production-grade keyboard shortcut system for POS operations.
 * 
 * F1 - Search Customer
 * F2 - Pay / Checkout
 * F3 - New Cart
 * F4 - Save Draft / Hold
 * F5 - Toggle Express
 * F6 - Clear Cart
 * F7 - Print Receipt
 * F8 - Apply Discount
 * Esc - Cancel / Close Modal
 * 
 * Number keys 1-9 - Quick switch between carts
 * 
 * @version 1.0.0
 */

import { useEffect, useCallback, useRef } from 'react';

export interface POSShortcuts {
    onSearchCustomer: () => void;
    onCheckout: () => void;
    onNewCart: () => void;
    onSaveDraft: () => void;
    onToggleExpress: () => void;
    onClearCart: () => void;
    onPrintReceipt: () => void;
    onApplyDiscount: () => void;
    onCancel: () => void;
    onSwitchCart: (index: number) => void;
    onQuickAddService?: (key: string) => void;
}

export interface ShortcutConfig {
    enabled: boolean;
    preventDefaults: boolean;
}

const DEFAULT_CONFIG: ShortcutConfig = {
    enabled: true,
    preventDefaults: true,
};

/**
 * Hook for POS keyboard shortcuts
 */
export function usePOSShortcuts(
    handlers: Partial<POSShortcuts>,
    config: Partial<ShortcutConfig> = {}
) {
    const { enabled, preventDefaults } = { ...DEFAULT_CONFIG, ...config };
    const handlersRef = useRef(handlers);

    // Keep handlers ref updated
    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement;
        const isInputField =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable;

        // Allow some shortcuts even in input fields
        const allowInInput = ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5'];

        if (isInputField && !allowInInput.includes(event.key)) {
            return;
        }

        const h = handlersRef.current;
        let handled = false;

        switch (event.key) {
            case 'F1':
                h.onSearchCustomer?.();
                handled = true;
                break;

            case 'F2':
                h.onCheckout?.();
                handled = true;
                break;

            case 'F3':
                h.onNewCart?.();
                handled = true;
                break;

            case 'F4':
                h.onSaveDraft?.();
                handled = true;
                break;

            case 'F5':
                h.onToggleExpress?.();
                handled = true;
                break;

            case 'F6':
                h.onClearCart?.();
                handled = true;
                break;

            case 'F7':
                h.onPrintReceipt?.();
                handled = true;
                break;

            case 'F8':
                h.onApplyDiscount?.();
                handled = true;
                break;

            case 'Escape':
                h.onCancel?.();
                handled = true;
                break;

            // Number keys 1-9 for cart switching (only when not in input)
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                if (!isInputField && event.ctrlKey) {
                    h.onSwitchCart?.(parseInt(event.key) - 1);
                    handled = true;
                }
                break;
        }

        if (handled && preventDefaults) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, [enabled, preventDefaults]);

    useEffect(() => {
        if (enabled) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [enabled, handleKeyDown]);
}

/**
 * Shortcut display information
 */
export const SHORTCUT_INFO = [
    { key: 'F1', action: 'Search Customer', icon: '🔍' },
    { key: 'F2', action: 'Pay / Checkout', icon: '💳' },
    { key: 'F3', action: 'New Cart', icon: '➕' },
    { key: 'F4', action: 'Save Draft', icon: '💾' },
    { key: 'F5', action: 'Toggle Express', icon: '⚡' },
    { key: 'F6', action: 'Clear Cart', icon: '🗑️' },
    { key: 'F7', action: 'Print Receipt', icon: '🖨️' },
    { key: 'F8', action: 'Apply Discount', icon: '🏷️' },
    { key: 'Esc', action: 'Cancel', icon: '❌' },
    { key: 'Ctrl+1-5', action: 'Switch Cart', icon: '🔄' },
];

/**
 * Shortcut Help Component
 */
export function ShortcutHelp({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    ⌨️ Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {SHORTCUT_INFO.map(shortcut => (
                        <div
                            key={shortcut.key}
                            className="flex items-center gap-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                        >
                            <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border text-xs font-mono font-bold">
                                {shortcut.key}
                            </kbd>
                            <span className="text-sm">{shortcut.action}</span>
                        </div>
                    ))}
                </div>
                <button
                    className="mt-4 w-full py-2 bg-primary text-white rounded-lg font-medium"
                    onClick={onClose}
                >
                    Got it
                </button>
            </div>
        </div>
    );
}
