'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3,
  Home, 
  Users, 
  Package, 
  Settings, 
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  X,
  ChevronDown,
  ChevronUp,
  User,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/actions/auth-actions';
import { cn } from '@/lib/utils';
import { useMobileSidebar } from '@/components/providers/mobile-sidebar-provider';

interface SidebarProps {
  onClose?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current: boolean;
  adminOnly?: boolean;
  children?: { 
    name: string; 
    href: string;
    icon?: React.ComponentType<any>;
  }[];
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});
  const { closeSidebar, isOpen } = useMobileSidebar();
  
  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: pathname === '/dashboard'
    },
    {
      name: 'Clients',
      href: '/dashboard/clients',
      icon: Users,
      current: pathname.startsWith('/dashboard/clients')
    },
    {
      name: 'Commandes',
      href: '/dashboard/commandes',
      icon: Package,
      current: pathname.startsWith('/dashboard/commandes')
    },
    {
      name: 'Statistiques',
      href: '/dashboard/statistiques',
      icon: BarChart3,
      current: pathname === '/dashboard/statistiques'
    },
    {
      name: 'Statut Notifications',
      href: '/dashboard/notifications/status',
      icon: Bell,
      current: pathname.startsWith('/dashboard/notifications')
    },
    {
      name: 'Administration',
      href: '/dashboard/admin/invitations',
      icon: Shield,
      current: pathname.startsWith('/dashboard/admin'),
      adminOnly: true
    },
    {
      name: 'Acces maintenance',
      href: '/dashboard/admin',
      icon: Shield,
      current: pathname.startsWith('/dashboard/admin'),
      adminOnly: true
    },
    {
      name: 'Paramètres',
      href: '/dashboard/settings',
      icon: Settings,
      current: pathname.startsWith('/dashboard/settings'),
      children: [
        { 
          name: 'Profil', 
          href: '/dashboard/profil',
          icon: User
        },
        { 
          name: 'Prix au kg', 
          href: '/dashboard/settings/prix',
          icon: DollarSign
        }
      ]
    }
  ];

  // Ouvrir automatiquement le sous-menu si on est sur une de ses pages
  useEffect(() => {
    const newOpenSubmenus: { [key: string]: boolean } = {};
    
    navigation.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => pathname === child.href);
        if (isChildActive) {
          newOpenSubmenus[item.name] = true;
        }
      }
    });
    
    setOpenSubmenus(newOpenSubmenus);
  }, [pathname]);

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const isSubmenuOpen = (itemName: string) => {
    return openSubmenus[itemName] || false;
  };

  const handleItemClick = () => {
    // Fermer la sidebar sur mobile quand on clique sur un élément
    closeSidebar();
  };

  const handleSubmenuItemClick = () => {
    // Fermer la sidebar sur mobile quand on clique sur un sous-élément
    closeSidebar();
  };

  const handleSignOut = async () => {
    // Fermer la sidebar sur mobile avant la déconnexion
    closeSidebar();
    await signOut();
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div
  className={cn(
    "flex flex-col h-full transition-all duration-300 relative z-50",
    collapsed ? "w-16" : "w-64",
    "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white shadow-2xl",
    "md:relative fixed left-0 top-0 transform transition-transform duration-300",
    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
  )}
>
  {/* Header */}
  <div className="flex items-center justify-between p-4 border-b border-white/10">
    {!collapsed && (
      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Colis-sn
      </h1>
    )}
    <div className="flex items-center gap-2">
      {/* Fermer mobile */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-300 hover:bg-gray-800 md:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {/* Collapse desktop */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="text-gray-300 hover:bg-gray-800 hidden md:flex"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  </div>

  {/* Navigation */}
  <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
    {navigation.map((item) => {
      const isItemSubmenuOpen = isSubmenuOpen(item.name);

      return (
        <div key={item.name}>
          {/* Item principal */}
          <div className="flex items-center">
            <Link
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group flex-1",
                item.current
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              title={collapsed ? item.name : undefined}
              onClick={handleItemClick}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="ml-3 group-hover:translate-x-1 transition-transform">
                  {item.name}
                </span>
              )}
            </Link>

            {/* Flèche pour les sous-menus */}
            {!collapsed && item.children && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white min-w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSubmenu(item.name);
                }}
              >
                {isItemSubmenuOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Sous-menu */}
          {!collapsed && item.children && (
            <div
              className={cn(
                "ml-8 mt-1 space-y-1 transition-all duration-300 overflow-hidden",
                isItemSubmenuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200",
                      pathname === child.href
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:bg-gray-700 hover:text-white"
                    )}
                    onClick={handleSubmenuItemClick}
                  >
                    {ChildIcon && (
                      <ChildIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                    )}
                    {child.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    })}
  </nav>

  {/* Footer */}
  <div className="p-4 border-t border-white/10">
    <form action={handleSignOut}>
      <Button
        type="submit"
        variant="ghost"
        className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white group"
        title={collapsed ? "Déconnexion" : undefined}
      >
        <LogOut className="h-5 w-5" />
        {!collapsed && <span className="ml-3">Déconnexion</span>}
      </Button>
    </form>
  </div>
</div>
    </>
  );
}