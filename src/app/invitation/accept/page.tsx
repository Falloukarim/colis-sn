'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as React from 'react'; // pour React.useActionState
import { acceptInvitation, InvitationState } from '@/actions/invitation-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initialState: InvitationState = {
  success: false,
};

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  // Remplace useFormState par useActionState
  const [state, formAction] = React.useActionState(
    acceptInvitation.bind(null, token!), 
    initialState
  );

  const [showPassword, setShowPassword] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Lien d'invitation invalide</CardTitle>
            <CardDescription>
              Le lien d'invitation est manquant ou incorrect.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Compte créé avec succès</CardTitle>
            <CardDescription>
              Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/login">Se connecter</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Rejoindre l'organisation</CardTitle>
          <CardDescription>
            Complétez vos informations pour finaliser votre inscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" name="firstName" placeholder="Votre prénom" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" name="lastName" placeholder="Votre nom" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Choisissez un mot de passe"
                required
                minLength={8}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="showPassword" className="text-sm font-normal">
                Afficher le mot de passe
              </Label>
            </div>

            <Button type="submit" className="w-full">
              Créer mon compte
            </Button>
          </form>

          {state?.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {state.error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
