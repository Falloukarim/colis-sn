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
  DollarSign,
  Scan,
  QrCode,
  Sparkles,
  Target,
  Zap,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/actions/auth-actions';
import { cn } from '@/lib/utils';
import { useMobileSidebar } from '@/components/providers/mobile-sidebar-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface SidebarProps {
  onClose?: () => void;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current: boolean;
  adminOnly?: boolean;
  badge?: string;
  children?: { 
    name: string; 
    href: string;
    icon?: React.ComponentType<any>;
    badge?: string;
  }[];
}

export default function Sidebar({ onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});
  const { closeSidebar, isOpen } = useMobileSidebar();
  
  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: pathname === '/dashboard',
      badge: '✨'
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
      current: pathname.startsWith('/dashboard/commandes'),
      badge: '🔥'
    },
    {
      name: 'Scanner QR',
      href: '/dashboard/scanner',
      icon: Scan,
      current: pathname === '/dashboard/scanner'
    },
    {
      name: 'Statistiques',
      href: '/dashboard/statistiques',
      icon: BarChart3,
      current: pathname === '/dashboard/statistiques'
    },
    {
      name: 'Notifications',
      href: '/dashboard/notifications/status',
      icon: Bell,
      current: pathname.startsWith('/dashboard/notifications'),
      badge: '3'
    },
    {
      name: 'Administration',
      href: '/dashboard/admin/invitations',
      icon: Shield,
      current: pathname.startsWith('/dashboard/admin'),
      adminOnly: true,
      badge: '⚡'
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
          name: 'Services & Prix', 
          href: '/dashboard/settings/prix',
          icon: DollarSign,
          badge: 'New'
        },
        { 
          name: 'QR Codes', 
          href: '/dashboard/settings/qr',
          icon: QrCode
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
    closeSidebar();
  };

  const handleSubmenuItemClick = () => {
    closeSidebar();
  };

  const handleSignOut = async () => {
    closeSidebar();
    await signOut();
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Overlay mobile avec animation */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar améliorée */}
      <div
        className={cn(
          "flex flex-col h-full transition-all duration-500 relative z-50",
          collapsed ? "w-20" : "w-80",
          "bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white shadow-2xl border-r border-white/10",
          "md:relative fixed left-0 top-0 h-screen transform transition-transform duration-500 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "backdrop-blur-xl bg-slate-900/95"
        )}
      >
        {/* Header avec logo et toggle */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-900/30">
          {!collapsed ? (
            <div className="flex items-center gap-3 flex-1">
              {/* Votre Logo */}
              <div className="flex items-center gap-3">
                <div>
                   <Image 
                    src="/colisen-logo.png" 
                    alt="COLISEN" 
                    width={40} 
                    height={40}
                    className="rounded-lg"
                  /> 
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                      COLISEN
                    </h1>
                   
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Simple&facile</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg mx-auto">
              {/* Logo réduit pour mode collapsed */}
              <div className="text-white font-bold text-sm">C</div>
              {/* Ou votre logo réduit : */}
              {/* <Image 
                src="/votre-logo.png" 
                alt="COLISEN" 
                width={24} 
                height={24}
                className="rounded"
              /> */}
            </div>
          )}
          
          <div className="flex items-center gap-1">
            {/* Fermer mobile */}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-gray-300 hover:bg-white/10 hover:text-white md:hidden transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {/* Collapse desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 text-gray-300 hover:bg-white/10 hover:text-white hidden md:flex transition-all duration-200"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* User Info Section */}
        {!collapsed && user && (
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-slate-800/30 to-slate-900/20">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {user.name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email || 'user@colisen.com'}
                </p>
                <Badge variant="secondary" className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  {user.role || 'Manager'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation améliorée */}
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          {navigation.map((item) => {
            const isItemSubmenuOpen = isSubmenuOpen(item.name);
            const Icon = item.icon;

            return (
              <div key={item.name} className="group">
                {/* Item principal */}
                <div className="flex items-center gap-1">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 group flex-1 relative overflow-hidden",
                      item.current
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white shadow-lg border border-blue-500/30 backdrop-blur-sm"
                        : "text-gray-300 hover:bg-white/5 hover:text-white hover:shadow-md border border-transparent hover:border-white/10"
                    )}
                    title={collapsed ? item.name : undefined}
                    onClick={handleItemClick}
                  >
                    {/* Background effect */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 opacity-0 transition-opacity duration-300",
                      item.current ? "opacity-100" : "group-hover:opacity-100"
                    )} />
                    
                    <div className="relative z-10 flex items-center w-full">
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        item.current 
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg" 
                          : "bg-white/5 group-hover:bg-white/10"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4 transition-transform duration-300",
                          item.current ? "text-white" : "text-gray-400 group-hover:text-white",
                          collapsed && "group-hover:scale-110"
                        )} />
                      </div>
                      
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1 ml-3">
                          <span className="font-medium group-hover:translate-x-1 transition-transform duration-300">
                            {item.name}
                          </span>
                          
                          {/* Badge */}
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "ml-2 px-1.5 py-0.5 text-xs border-0",
                                item.current 
                                  ? "bg-white/20 text-white" 
                                  : "bg-blue-500/20 text-blue-400"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Flèche pour les sous-menus */}
                  {!collapsed && item.children && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 min-w-8 transition-all duration-300",
                        isItemSubmenuOpen && "text-blue-400 rotate-180"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSubmenu(item.name);
                      }}
                    >
                      <ChevronDown className="h-3 w-3 transition-transform duration-300" />
                    </Button>
                  )}
                </div>

                {/* Sous-menu animé */}
                {!collapsed && item.children && (
                  <div
                    className={cn(
                      "ml-4 space-y-1 transition-all duration-500 overflow-hidden",
                      isItemSubmenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-300 group relative overflow-hidden",
                            pathname === child.href
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "text-gray-400 hover:bg-white/5 hover:text-white hover:border hover:border-white/5"
                          )}
                          onClick={handleSubmenuItemClick}
                        >
                          {/* Ligne d'accent */}
                          <div className={cn(
                            "absolute left-0 top-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full transform -translate-y-1/2 transition-all duration-300",
                            pathname === child.href ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )} />
                          
                          {ChildIcon && (
                            <ChildIcon className={cn(
                              "h-3.5 w-3.5 mr-3 flex-shrink-0 transition-colors duration-300",
                              pathname === child.href ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"
                            )} />
                          )}
                          <span className="font-medium">{child.name}</span>
                          
                          {/* Badge enfant */}
                          {child.badge && (
                            <Badge 
                              variant="secondary" 
                              className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 border-0"
                            >
                              {child.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer avec actions */}
        <div className="p-4 border-t border-white/10 bg-gradient-to-t from-slate-900/50 to-transparent">
          {/* Quick Actions */}
          {!collapsed && (
            <div className="mb-4 space-y-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg"
                  asChild
                >
                  <Link href="/dashboard/commandes/create">
                    <Package className="h-3 w-3 mr-1" />
                    Nouveau
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                </Button>
              </div>
            </div>
          )}

          {/* Déconnexion */}
          <form action={handleSignOut}>
            <Button
              type="submit"
              variant="ghost"
              className={cn(
                "w-full justify-start text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 group border border-transparent hover:border-red-500/30",
                collapsed && "justify-center"
              )}
              title={collapsed ? "Déconnexion" : undefined}
            >
              <LogOut className={cn(
                "h-4 w-4 transition-transform duration-300",
                collapsed ? "group-hover:scale-110" : "mr-3"
              )} />
              {!collapsed && (
                <span className="group-hover:translate-x-1 transition-transform duration-300">
                  Déconnexion
                </span>
              )}
            </Button>
          </form>

          {/* Version et statut */}
          {!collapsed && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>v2.1.0</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span>En ligne</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}