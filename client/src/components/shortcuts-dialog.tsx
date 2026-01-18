/**
 * KEYBOARD SHORTCUTS DIALOG
 * Shows all available shortcuts - Press F1 to open
 */

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface ShortcutsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const shortcuts = [
    {
        category: 'Navigation',
        items: [
            { keys: ['F4'], description: 'Go to Dashboard' },
            { keys: ['Alt', '1'], description: 'Orders Page' },
            { keys: ['Alt', '2'], description: 'Customers Page' },
            { keys: ['Alt', '3'], description: 'Services Page' },
            { keys: ['Alt', '4'], description: 'Reports Page' },
            { keys: ['Escape'], description: 'Close Dialog / Go Back' },
        ],
    },
    {
        category: 'Actions',
        items: [
            { keys: ['F2'], description: 'Create New Order' },
            { keys: ['Ctrl', 'N'], description: 'New Order (Alternative)' },
            { keys: ['F3'], description: 'Quick Search' },
            { keys: ['Ctrl', 'F'], description: 'Search (Alternative)' },
            { keys: ['F5'], description: 'Refresh Data' },
            { keys: ['Ctrl', 'S'], description: 'Save Current Form' },
        ],
    },
    {
        category: 'Printing',
        items: [
            { keys: ['F9'], description: 'Print Bill / Invoice' },
            { keys: ['Ctrl', 'P'], description: 'Print (Alternative)' },
        ],
    },
    {
        category: 'Help',
        items: [
            { keys: ['F1'], description: 'Show This Help' },
        ],
    },
];

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {shortcuts.map((section) => (
                        <div key={section.category}>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                                {section.category}
                            </h3>
                            <div className="space-y-2">
                                {section.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <span className="text-sm">{item.description}</span>
                                        <div className="flex items-center gap-1">
                                            {item.keys.map((key, keyIdx) => (
                                                <React.Fragment key={keyIdx}>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {key}
                                                    </Badge>
                                                    {keyIdx < item.keys.length - 1 && (
                                                        <span className="text-muted-foreground text-xs">+</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t text-center">
                    <p className="text-sm text-muted-foreground">
                        Press <Badge variant="outline" className="font-mono mx-1">Esc</Badge> to close
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ShortcutsDialog;
