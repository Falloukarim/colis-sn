const { sendSMS, sendWhatsApp, getNotificationServiceStatus } = require('../src/lib/utils/notification');

async function testNotifications() {
  console.log('🧪 Test des services de notification');
  console.log('====================================');
  
  const status = getNotificationServiceStatus();
  console.log('📊 Statut:', status.message);
  console.log('');
  
  // Test SMS
  console.log('📱 Test SMS...');
  const smsResult = await sendSMS('+33612345678', 'Ceci est un test SMS de votre application');
  console.log('✅ Résultat SMS:', smsResult ? 'SUCCÈS' : 'ÉCHEC');
  console.log('');
  
  // Test WhatsApp
  console.log('💚 Test WhatsApp...');
  const whatsappResult = await sendWhatsApp('+33687654321', 'Ceci est un test WhatsApp de votre application');
  console.log('✅ Résultat WhatsApp:', whatsappResult ? 'SUCCÈS' : 'ÉCHEC');
  console.log('');
  
  console.log('🎉 Test terminé !');
}

testNotifications().catch(console.error);