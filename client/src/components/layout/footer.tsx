import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="status-indicator status-online"></div>
          <span className="text-label text-muted-foreground">System Online</span>
        </div>
        <div className="text-caption text-muted-foreground">
          © 2025 Ace-Digital. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
