const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSubscriptions() {
  console.log('Vérification des abonnements expirés...');
  
  // Récupérer les organisations dont l'abonnement a expiré
  const { data: expiredOrganizations, error } = await supabase
    .from('organizations')
    .select('*')
    .lte('subscription_end_date', new Date().toISOString())
    .neq('subscription_status', 'expired');

  if (error) {
    console.error('Erreur lors de la récupération des organisations:', error);
    return;
  }

  // Mettre à jour le statut des abonnements expirés
  for (const org of expiredOrganizations) {
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ subscription_status: 'expired' })
      .eq('id', org.id);

    if (updateError) {
      console.error(`Erreur lors de la mise à jour de l'organisation ${org.id}:`, updateError);
    } else {
      console.log(`Abonnement expiré pour l'organisation: ${org.name}`);
    }
  }

  console.log('Vérification des abonnements terminée.');
}

checkSubscriptions();