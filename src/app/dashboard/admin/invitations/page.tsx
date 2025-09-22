'use client';

import { useState } from 'react';
import { useActionState } from 'react'; // ✅ changement ici
import { inviteUser } from '@/actions/invitation-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InvitationFormState {
  success: boolean;
  message?: string;
  error?: string;
}

const initialState: InvitationFormState = {
  success: false,
};

export default function InvitationsPage() {
  const [state, formAction] = useActionState(inviteUser, initialState); // ✅ corrigé
  const [role, setRole] = useState('manager');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des invitations</h1>
        <p className="text-gray-600">Invitez des membres à rejoindre votre organisation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle invitation</CardTitle>
          <CardDescription>
            Envoyez une invitation à un nouvel utilisateur pour qu'il rejoigne votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@exemple.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select name="role" value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit">Envoyer l'invitation</Button>
          </form>

          {state?.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md">
              {state.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
