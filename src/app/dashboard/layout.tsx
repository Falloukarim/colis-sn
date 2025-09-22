import Sidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';
import MobileSidebar from '@/components/dashboard/mobile-sidebar';
import { Toaster } from '@/components/ui/toaster'; 
import { createServerSupabaseClient } from '@/lib/supabase/server-ssr';
import MobileSidebarProvider from '@/components/providers/mobile-sidebar-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  let organizationName = 'Mon Organisation';
  
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
      
    if (userData) {
      const { data: organization } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', userData.organization_id)
        .single();
        
      if (organization) {
        organizationName = organization.name;
      }
    }
  }

 return (
    <MobileSidebarProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar cachée sur mobile, visible sur desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Contenu principal - pleine largeur sur mobile */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          <Header organizationName={organizationName} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
            <div className="w-full mx-auto">
              {children}
            </div>
          </main>
          {/* Le Toaster doit être ici pour être accessible partout */}
          <Toaster />
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar />
      </div>
    </MobileSidebarProvider>
  );
}
