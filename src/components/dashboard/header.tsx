'use client';

import { Bell, User, QrCode, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/actions/auth-actions';
import { useToast } from '@/components/ui/use-toast';
import QRScanner from '@/components/qr-scanner';
import Link from 'next/link';
import { useMobileSidebar } from '@/components/providers/mobile-sidebar-provider';
import { useState } from 'react';

interface HeaderProps {
  organizationName?: string;
  subscriptionStatus?: string;
}

export default function Header({ organizationName, subscriptionStatus }: HeaderProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const { toast } = useToast();
  const { openSidebar } = useMobileSidebar();

  const handleScanSuccess = () => {
    toast({
      title: 'Succès',
      description: 'Commande marquée comme remise',
      variant: 'default',
    });
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
          {/* Left side - Menu button and organization card */}
          <div className="flex items-center gap-3">
            {/* Menu button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={openSidebar}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Organization Card */}
            <div className="bg-gradient-to-r from-blue-200 to-blue-300 text-gray px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span className="font-semibold text-lg md:text-xl">
                {organizationName || 'Mon Organisation'}
              </span>
            </div>
          </div>

          {/* Right side - Actions and user menu */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* QR Scanner button */}
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setScannerOpen(true)}
              className="hidden sm:flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden md:inline">Scanner QR</span>
            </Button>

            {/* Mobile QR button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setScannerOpen(true)}
              className="sm:hidden"
            >
              <QrCode className="h-5 w-5" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <Link href="/dashboard/profil">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Profil
                  </DropdownMenuItem>
                </Link>
                
                <Link href="/dashboard/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                </Link>
                
                <DropdownMenuSeparator />

                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Déconnexion
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Scanner Modal */}
      <QRScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}
