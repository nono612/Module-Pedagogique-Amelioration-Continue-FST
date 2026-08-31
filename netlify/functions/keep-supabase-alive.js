const { createClient } = require('@supabase/supabase-js');

/*
  Ping planifié pour empêcher la mise en pause du projet Supabase gratuit
  (pause automatique après une semaine sans activité). Déclenché par Netlify
  Scheduled Functions selon le cron défini dans netlify.toml.

  On utilise une requête HEAD sur "profiles" (select('*',{head:true})) plutôt
  qu'un SELECT sur une colonne précise comme "id" : ça évite toute dépendance
  au schéma exact de la table (colonnes, noms) — seule son existence compte,
  et aucune ligne n'est transférée.
*/
exports.handler = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Variables d'environnement SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY manquantes sur Netlify.",
      }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Ping Supabase réussi — base de données maintenue active.',
        table: 'profiles',
        rowCount: count,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message || String(err),
      }),
    };
  }
};
