// ============================================================
// SETUP — Create tables in Supabase
// Run: node setup.js
// ============================================================
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function setup() {
    console.log('🔧 Configurando banco de dados...\n');

    // Read schema SQL
    const schema = fs.readFileSync(require('path').resolve(__dirname, 'schema.sql'), 'utf8');

    // Split into individual statements
    const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
        try {
            const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
            if (error) {
                // Try alternative: direct REST API call
                console.log(`  ⚠ RPC não disponível, tentando via REST...`);
                break;
            }
            console.log(`  ✅ Executado com sucesso`);
        } catch (e) {
            console.log(`  ⚠ Método RPC não suportado`);
            break;
        }
    }

    // Test if tables exist by trying to query them
    console.log('\n📋 Verificando tabelas...');
    
    const { error: e1 } = await supabase.from('classes').select('id').limit(1);
    console.log(`  classes: ${e1 ? '❌ ' + e1.message : '✅ OK'}`);

    const { error: e2 } = await supabase.from('students').select('id').limit(1);
    console.log(`  students: ${e2 ? '❌ ' + e2.message : '✅ OK'}`);

    const { error: e3 } = await supabase.from('reading_logs').select('id').limit(1);
    console.log(`  reading_logs: ${e3 ? '❌ ' + e3.message : '✅ OK'}`);

    if (e1 || e2 || e3) {
        console.log('\n══════════════════════════════════════════════════');
        console.log('⚠️  ATENÇÃO: As tabelas precisam ser criadas manualmente!');
        console.log('══════════════════════════════════════════════════');
        console.log('\n1. Acesse: https://supabase.com/dashboard');
        console.log('2. Abra seu projeto');
        console.log('3. Vá em "SQL Editor"');
        console.log('4. Cole o conteúdo do arquivo schema.sql');
        console.log('5. Clique em "Run"');
        console.log('6. Depois execute: node seed.js\n');
    } else {
        console.log('\n✅ Todas as tabelas existem! Execute: node seed.js');
    }
}

setup().catch(console.error);
