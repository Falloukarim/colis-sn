'use client';

import { useMobileSidebar } from '@/components/providers/mobile-sidebar-provider';
import Sidebar from './sidebar';
import { cn } from '@/lib/utils';

export default function MobileSidebar() {
  const { isOpen, closeSidebar } = useMobileSidebar();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar mobile */}
      <div className={cn(
        "fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 md:hidden",
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar onClose={closeSidebar} />
      </div>
    </>
  );
}