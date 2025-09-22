'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

export interface InvitationState {
  success: boolean;
  message?: string;
  error?: string;
}

// Client service role
const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialiser Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function inviteUser(
  prevState: InvitationState, 
  formData: FormData
): Promise<InvitationState> {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié');
    }
    
    // Vérifier que l'utilisateur a le rôle owner
    const { data: currentUser, error: userDataError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();
      
    if (userDataError || !currentUser || currentUser.role !== 'owner') {
      throw new Error('Seuls les propriétaires peuvent inviter des utilisateurs');
    }
    
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    
    // Validation
    if (!email || !role) {
      throw new Error('Email et rôle sont requis');
    }
    
    // Vérifier si l'email n'est pas déjà utilisé dans l'organisation
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('organization_id', currentUser.organization_id)
      .single();
      
    if (existingUser && !existingUserError) {
      throw new Error('Cet utilisateur fait déjà partie de votre organisation');
    }
    
    // Vérifier si une invitation en attente existe déjà
    const { data: existingInvitation, error: existingInvitationError } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', currentUser.organization_id)
      .eq('status', 'pending')
      .single();
      
    if (existingInvitation && !existingInvitationError) {
      throw new Error('Une invitation est déjà en attente pour cet email');
    }
    
    // Générer un token unique
    const token = randomBytes(32).toString('hex');
    
    // Créer l'invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert([{
        organization_id: currentUser.organization_id,
        email,
        role,
        token,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }])
      .select()
      .single();
      
    if (invitationError) {
      throw new Error('Erreur lors de la création de l\'invitation');
    }
    
    // Envoyer l'email d'invitation avec Resend
    await sendInvitationEmail(email, token, currentUser.organization_id);
    
    return { success: true, message: 'Invitation envoyée avec succès' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function acceptInvitation(
  token: string, 
  prevState: InvitationState, 
  formData: FormData
): Promise<InvitationState> {
  try {
    const supabase = await createClient();
    
    // Récupérer l'invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*, organizations(*)')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();
      
    if (invitationError || !invitation) {
      console.error('Erreur invitation:', invitationError);
      throw new Error('Invitation invalide ou expirée');
    }
    
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    
    // Validation
    if (!password || !firstName || !lastName) {
      throw new Error('Tous les champs sont requis');
    }
    
    // Créer le compte utilisateur Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          organization_id: invitation.organization_id,
          role: invitation.role,
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    
    if (authError) {
      console.error('Erreur auth:', authError);
      throw new Error(authError.message);
    }
    
    // Créer l'utilisateur dans la table users
    if (authData.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: invitation.email,
          organization_id: invitation.organization_id,
          role: invitation.role,
          first_name: firstName,
          last_name: lastName,
        }]);
        
      if (userError) {
        console.error('Erreur détaillée création user:', userError);
        throw new Error(`Erreur lors de la création de l'utilisateur: ${userError.message}`);
      }
    }
    
    // Marquer l'invitation comme acceptée
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);
    
    return { success: true, message: 'Compte créé avec succès' };
  } catch (error: any) {
    console.error('Erreur complète acceptInvitation:', error);
    return { success: false, error: error.message };
  }
}

async function sendInvitationEmail(email: string, token: string, organizationId: string) {
  try {
    const { data: organization } = await supabaseService
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();
    
    if (!organization) {
      console.error('Organisation non trouvée');
      return;
    }
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const invitationLink = `${siteUrl}/invitation/accept?token=${token}`;
    
    // Vérifier que la clé API Resend est configurée
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY non configurée - mode simulation activé');
      console.log(`Simulation d'envoi à: ${email}`);
      console.log(`Lien: ${invitationLink}`);
      return;
    }
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: `Invitation à rejoindre ${organization.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                .content { background: #f9fafb; padding: 30px; }
                .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Invitation à ${organization?.name}</h1>
                </div>
                <div class="content">
                    <h2>Bonjour,</h2>
                    <p>Vous avez été invité à rejoindre <strong>${organization?.name}</strong> sur notre plateforme de gestion de colis.</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${invitationLink}" class="button">Accepter l'invitation</a>
                    </p>
                    <p>Vous pouvez également copier ce lien dans votre navigateur :</p>
                    <p style="word-break: break-all; color: #3b82f6;">${invitationLink}</p>
                    <p><strong>⚠️ Important :</strong> Ce lien expirera dans 7 jours.</p>
                </div>
                <div class="footer">
                    <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
                    <p>© ${new Date().getFullYear()} Plateforme de Gestion de Colis</p>
                </div>
            </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      // Fallback: logger le lien pour le développement
      console.log(`Lien d'invitation (fallback): ${invitationLink}`);
      return;
    }

    console.log('Email envoyé avec succès:', data?.id);
    
  } catch (error) {
    console.error('Erreur sendInvitationEmail:', error);
  }
}