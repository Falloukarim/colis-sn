'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileHeaderProps {
  onMenuClick: () => void;
  organizationName?: string;
}

export default function MobileHeader({ onMenuClick, organizationName }: MobileHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h2 className="text-lg font-semibold text-gray-900">
            {organizationName || 'Mon Organisation'}
          </h2>
        </div>
      </div>
    </header>
  );
}