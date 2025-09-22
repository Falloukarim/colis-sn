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
      name: 'Admin',
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
          href: '/dashboard/settings/profile',
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
      <div className={cn(
        "bg-gray-900 text-white flex flex-col h-full transition-all duration-300 relative z-50",
        collapsed ? 'w-16' : 'w-64',
        "md:relative fixed left-0 top-0 transform transition-transform duration-300",
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="flex items-center justify-between p-4">
          {!collapsed && (
            <h1 className="text-xl font-bold text-white">ColisManager</h1>
          )}
          
          <div className="flex items-center gap-2">
            {/* Bouton pour fermer sur mobile */}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-gray-800 md:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Bouton collapse/expand (seulement sur desktop) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-white hover:bg-gray-800 hidden md:flex"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isItemSubmenuOpen = isSubmenuOpen(item.name);
            
            return (
              <div key={item.name}>
                {/* Item principal */}
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group flex-1",
                      item.current
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                    title={collapsed ? item.name : undefined}
                    onClick={handleItemClick}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="ml-3">{item.name}</span>}
                  </Link>

                  {/* Flèche pour les items avec sous-menu */}
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
                {!collapsed && item.children && isItemSubmenuOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
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

        <div className="p-4 border-t border-gray-700">
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