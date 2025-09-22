import QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
  try {
    // Retournez directement le Data URL Base64
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Supprimez la fonction saveQRCode ou modifiez-la
export function saveQRCode(qrCodeData: string, commandeId: string): string {
  // Retournez directement le Data URL
  return qrCodeData;
}