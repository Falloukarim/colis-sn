import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MessageSquare } from 'lucide-react';
import { getClientById } from '@/actions/client-actions';
import { getCommandes } from '@/actions/commande-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientPageProps {
  params: {
    id: string;
  };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { client, error } = await getClientById(params.id);

  if (error || !client) {
    notFound();
  }

  const { commandes } = await getCommandes();
  const clientCommandes = commandes.filter(commande => commande.client_id === params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Détails du client</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{client.nom}</h3>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{client.telephone}</span>
            </div>

            {client.whatsapp && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp: {client.whatsapp}</span>
              </div>
            )}

            {client.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{client.email}</span>
              </div>
            )}

            <div className="text-sm text-gray-500">
              Client depuis le {new Date(client.created_at).toLocaleDateString('fr-FR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total des commandes:</span>
              <span className="font-semibold">{clientCommandes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">En cours:</span>
              <span className="font-semibold text-yellow-600">
                {clientCommandes.filter(c => c.statut === 'en_cours').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Disponibles:</span>
              <span className="font-semibold text-green-600">
                {clientCommandes.filter(c => c.statut === 'disponible').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Remises:</span>
              <span className="font-semibold text-blue-600">
                {clientCommandes.filter(c => c.statut === 'remis').length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Historique des commandes</span>
            <Link href={`/commandes/create?client_id=${client.id}`}>
              <Button>Nouvelle commande</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientCommandes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune commande pour ce client</p>
          ) : (
            <div className="space-y-4">
              {clientCommandes.map((commande) => (
                <div key={commande.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">Commande #{commande.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">
                      Statut: <span className={`font-medium ${
                        commande.statut === 'en_cours' ? 'text-yellow-600' :
                        commande.statut === 'disponible' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {commande.statut}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Créée le {new Date(commande.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Link href={`/commandes/${commande.id}`}>
                    <Button variant="outline">Voir détails</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}