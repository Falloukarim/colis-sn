import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'colis-sn',
    short_name: 'colis-sn',
    description: 'Application de gestion de colis',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable' // CORRIGÉ : 'maskable' au lieu de 'maskable any'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any' // CORRIGÉ : 'any' séparé
      }
    ],
    categories: ['business', 'productivity'],
    lang: 'fr',
  }
}