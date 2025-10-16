'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkInstalled = () => {
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      ) {
        setIsInstalled(true)
        return true
      }
      return false
    }

    // Vérifier au chargement
    if (checkInstalled()) return

    // Écouter l'événement d'installation
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Vérifier si l'utilisateur a déjà refusé récemment
      const lastDismissed = localStorage.getItem('pwaPromptDismissed')
      if (!lastDismissed || Date.now() - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler as EventListener)

    // Écouter si l'app est installée
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      localStorage.removeItem('pwaPromptDismissed')
    })

    // Vérifier périodiquement
    const interval = setInterval(checkInstalled, 1000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener)
      clearInterval(interval)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installée avec succès!')
        setDeferredPrompt(null)
        setShowInstallPrompt(false)
      }
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error)
    }
  }

  const dismissPrompt = () => {
    setShowInstallPrompt(false)
    // Stocker le timestamp du refus
    localStorage.setItem('pwaPromptDismissed', Date.now().toString())
  }

  // Ne rien afficher si déjà installé ou si pas de prompt
  if (isInstalled || !showInstallPrompt) return null

  return (
    <div className="pwa-installer-overlay">
      <div className="pwa-installer-modal">
        <div className="pwa-installer-content">
          <div className="pwa-installer-icon">
            <img src="/icon-192x192.png" alt="App Icon" width={64} height={64} />
          </div>
          <div className="pwa-installer-text">
            <h3>Installer l&apos;application</h3>
            <p>Ajoutez cette application à votre écran d&apos;accueil pour une expérience optimale !</p>
            <ul>
              <li>✅ Accès rapide</li>
              <li>✅ Fonctionne hors ligne</li>
              <li>✅ Expérience native</li>
            </ul>
          </div>
        </div>
        <div className="pwa-installer-actions">
          <button 
            onClick={installApp}
            className="pwa-install-btn"
          >
            📲 Installer
          </button>
          <button 
            onClick={dismissPrompt}
            className="pwa-dismiss-btn"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}