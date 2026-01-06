/**
 * KEYBOARD SHORTCUTS SYSTEM
 * Windows-friendly shortcuts for fast navigation and actions
 * 
 * Global Shortcuts:
 * - F1: Help / Shortcuts Guide
 * - F2: New Order
 * - F3: Quick Search
 * - F4: Dashboard
 * - F5: Refresh Data
 * - F9: Print Bill
 * - Ctrl+N: New Order
 * - Ctrl+F: Search
 * - Ctrl+P: Print
 * - Ctrl+S: Save
 * - Escape: Close Dialog / Go Back
 */

import { useEffect, useCallback } from 'react';

// Shortcut definitions
export interface Shortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    description: string;
    action: () => void;
    global?: boolean;
}

// Global shortcuts registry
const globalShortcuts: Map<string, Shortcut> = new Map();

// Generate shortcut key identifier
function getShortcutId(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
}

// Check if element is an input
function isInputElement(el: Element | null): boolean {
    if (!el) return false;
    const tagName = el.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' ||
        (el as HTMLElement).isContentEditable;
}

// Global keyboard handler
function handleKeyDown(e: KeyboardEvent) {
    const shortcutId = getShortcutId(e);
    const shortcut = globalShortcuts.get(shortcutId);

    // Skip if typing in input (except for Escape and F-keys)
    if (isInputElement(document.activeElement)) {
        if (!e.key.startsWith('F') && e.key !== 'Escape') {
            return;
        }
    }

    if (shortcut) {
        e.preventDefault();
        shortcut.action();
    }
}

// Initialize global keyboard listeners
let isInitialized = false;
export function initKeyboardShortcuts() {
    if (isInitialized) return;
    document.addEventListener('keydown', handleKeyDown);
    isInitialized = true;
}

// Register a shortcut
export function registerShortcut(shortcut: Shortcut) {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    parts.push(shortcut.key.toLowerCase());
    const id = parts.join('+');
    globalShortcuts.set(id, shortcut);
}

// Unregister a shortcut
export function unregisterShortcut(key: string, ctrl?: boolean, alt?: boolean, shift?: boolean) {
    const parts: string[] = [];
    if (ctrl) parts.push('ctrl');
    if (alt) parts.push('alt');
    if (shift) parts.push('shift');
    parts.push(key.toLowerCase());
    globalShortcuts.delete(parts.join('+'));
}

// Get all shortcuts for display
export function getAllShortcuts(): Shortcut[] {
    return Array.from(globalShortcuts.values());
}

/**
 * Hook to use keyboard shortcuts in a component
 */
export function useKeyboardShortcut(
    key: string,
    callback: () => void,
    options: { ctrl?: boolean; alt?: boolean; shift?: boolean; description?: string } = {}
) {
    useEffect(() => {
        const shortcut: Shortcut = {
            key,
            ctrl: options.ctrl,
            alt: options.alt,
            shift: options.shift,
            description: options.description || `${key} shortcut`,
            action: callback,
        };
        registerShortcut(shortcut);

        return () => {
            unregisterShortcut(key, options.ctrl, options.alt, options.shift);
        };
    }, [key, callback, options.ctrl, options.alt, options.shift, options.description]);
}

/**
 * Hook to register multiple shortcuts at once
 */
export function useKeyboardShortcuts(shortcuts: Omit<Shortcut, 'action'>[], callbacks: (() => void)[]) {
    useEffect(() => {
        shortcuts.forEach((shortcut, index) => {
            if (callbacks[index]) {
                registerShortcut({ ...shortcut, action: callbacks[index] });
            }
        });

        return () => {
            shortcuts.forEach(shortcut => {
                unregisterShortcut(shortcut.key, shortcut.ctrl, shortcut.alt, shortcut.shift);
            });
        };
    }, [shortcuts, callbacks]);
}

// Default shortcuts list with descriptions
export const DEFAULT_SHORTCUTS = [
    { key: 'F1', description: 'Help / Show Shortcuts' },
    { key: 'F2', description: 'Create New Order' },
    { key: 'F3', description: 'Quick Search' },
    { key: 'F4', description: 'Go to Dashboard' },
    { key: 'F5', description: 'Refresh Data' },
    { key: 'F9', description: 'Print Current Bill' },
    { key: 'N', ctrl: true, description: 'New Order' },
    { key: 'F', ctrl: true, description: 'Search' },
    { key: 'P', ctrl: true, description: 'Print' },
    { key: 'S', ctrl: true, description: 'Save' },
    { key: 'Escape', description: 'Close / Cancel' },
    { key: '1', alt: true, description: 'Orders Page' },
    { key: '2', alt: true, description: 'Customers Page' },
    { key: '3', alt: true, description: 'Services Page' },
    { key: '4', alt: true, description: 'Reports Page' },
];

// Format shortcut for display
export function formatShortcut(shortcut: { key: string; ctrl?: boolean; alt?: boolean; shift?: boolean }): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
}
