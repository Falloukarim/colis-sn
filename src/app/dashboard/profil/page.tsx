'use client';

import { useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, EyeOff, User, Mail, Phone, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { updateProfile, changePassword, getProfile } from '@/actions/profile-actions'; // ← Ajoutez getProfile

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // ← Nouvel état

  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Charger les données du profil au montage
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { success, error, profile } = await getProfile();
        
        if (success && profile) {
          setUserData({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || '',
            phone: profile.phone || ''
          });
        } else if (error) {
          toast({
            title: 'Erreur',
            description: error || 'Erreur lors du chargement du profil',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Erreur',
          description: 'Erreur lors du chargement du profil',
          variant: 'destructive',
        });
      } finally {
        setInitialLoad(false);
      }
    };

    loadProfile();
  }, [toast]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(userData);
      
      if (result.success) {
        toast({
          title: 'Succès',
          description: 'Profil mis à jour avec succès',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Erreur lors de la mise à jour',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation côté client
  if (!passwordData.currentPassword) {
    toast({
      title: 'Erreur',
      description: 'Veuillez saisir votre mot de passe actuel',
      variant: 'destructive',
    });
    return;
  }

  if (!passwordData.newPassword) {
    toast({
      title: 'Erreur',
      description: 'Veuillez saisir un nouveau mot de passe',
      variant: 'destructive',
    });
    return;
  }

  if (passwordData.newPassword.length < 6) {
    toast({
      title: 'Erreur',
      description: 'Le mot de passe doit contenir au moins 6 caractères',
      variant: 'destructive',
    });
    return;
  }

  if (passwordData.newPassword !== passwordData.confirmPassword) {
    toast({
      title: 'Erreur',
      description: 'Les mots de passe ne correspondent pas',
      variant: 'destructive',
    });
    return;
  }

  if (passwordData.currentPassword === passwordData.newPassword) {
    toast({
      title: 'Erreur',
      description: 'Le nouveau mot de passe doit être différent de l\'actuel',
      variant: 'destructive',
    });
    return;
  }

  setPasswordLoading(true);

  try {
    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
    
    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Mot de passe changé avec succès',
        variant: 'default',
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      // Affichage des erreurs spécifiques venant du serveur
      toast({
        title: 'Erreur',
        description: result.error || 'Erreur lors du changement de mot de passe',
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('Password change error:', error);
    toast({
      title: 'Erreur',
      description: 'Une erreur inattendue est survenue lors du changement de mot de passe',
      variant: 'destructive',
    });
  } finally {
    setPasswordLoading(false);
  }
};

  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos informations personnelles et votre mot de passe
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Changement de mot de passe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Changez votre mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
  <div className="relative">
    <Input
      id="newPassword"
      type={showNewPassword ? 'text' : 'password'}
      value={passwordData.newPassword}
      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
      required
      minLength={6}
      placeholder="Au moins 6 caractères"
      className={passwordData.newPassword.length > 0 && passwordData.newPassword.length < 6 ? 'border-red-500' : ''}
    />
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-0 top-0 h-full px-3"
      onClick={() => setShowNewPassword(!showNewPassword)}
    >
      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  </div>
  {passwordData.newPassword.length > 0 && passwordData.newPassword.length < 6 && (
    <p className="text-red-500 text-xs">Le mot de passe doit contenir au moins 6 caractères</p>
  )}
</div>

<div className="space-y-2">
  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
  <div className="relative">
    <Input
      id="confirmPassword"
      type={showConfirmPassword ? 'text' : 'password'}
      value={passwordData.confirmPassword}
      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
      required
      minLength={6}
      placeholder="Retapez le nouveau mot de passe"
      className={
        passwordData.confirmPassword.length > 0 && 
        passwordData.newPassword !== passwordData.confirmPassword ? 
        'border-red-500' : ''
      }
    />
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-0 top-0 h-full px-3"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    >
      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  </div>
  {passwordData.confirmPassword.length > 0 && 
   passwordData.newPassword !== passwordData.confirmPassword && (
    <p className="text-red-500 text-xs">Les mots de passe ne correspondent pas</p>
  )}
</div>

              <div className="space-y-2">
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={passwordLoading}
                className="flex items-center gap-2"
              >
                {passwordLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                Changer le mot de passe
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}