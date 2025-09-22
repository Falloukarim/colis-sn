import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, PackageCheck, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  clientsCount: number;
  commandesEnCours: number;
  commandesDisponibles: number;
  commandesRemises: number;
}

export default function StatsCards({
  clientsCount,
  commandesEnCours,
  commandesDisponibles,
  commandesRemises
}: StatsCardsProps) {
  const stats = [
    {
      title: 'Clients',
      value: clientsCount,
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'En cours',
      value: commandesEnCours,
      icon: Package,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: 'Disponibles',
      value: commandesDisponibles,
      icon: PackageOpen,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Remises',
      value: commandesRemises,
      icon: PackageCheck,
      color: 'text-green-600 bg-green-100'
    }
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={cn("p-2 md:p-3 rounded-full", stat.color)}>
                <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}