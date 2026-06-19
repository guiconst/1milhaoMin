// ============================================================
// SEED DATA — Desafio 1 Milhão de Minutos
// Run: node seed.js
// ============================================================
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function seed() {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    // ── 1. Criar turmas ──
    console.log('📚 Criando turmas...');
    const classes = [
        { name: '3º Ano A', level: 'Ensino Médio', teacher_name: 'Prof. Marcos Silva' },
        { name: '2º Ano B', level: 'Ensino Médio', teacher_name: 'Profa. Ana Costa' },
        { name: '1º Ano C', level: 'Ensino Médio', teacher_name: 'Prof. João Pedro' },
        { name: '9º Ano A', level: 'Ensino Fundamental', teacher_name: 'Profa. Maria Santos' },
        { name: '8º Ano B', level: 'Ensino Fundamental', teacher_name: 'Prof. Carlos Lima' },
        { name: '7º Ano A', level: 'Ensino Fundamental', teacher_name: 'Profa. Fernanda Rocha' },
        { name: '6º Ano C', level: 'Ensino Fundamental', teacher_name: 'Prof. Ricardo Alves' },
    ];

    const { error: classError } = await supabase.from('classes').upsert(classes, { onConflict: 'name' });
    if (classError) {
        console.error('Erro ao criar turmas:', classError.message);
    } else {
        console.log(`  ✅ ${classes.length} turmas criadas`);
    }

    // ── 2. Criar alunos ──
    console.log('\n👩‍🎓 Criando alunos...');
    const defaultPassword = await bcrypt.hash('123456', 10);

    const students = [
        {
            rm: '12345',
            email: 'joao@sesi.edu.br',
            password_hash: defaultPassword,
            name: 'João Silva',
            avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFEJzw5SXb1kSReHBfg2AuSJf9CMJiCIaXK7Imn0InlfqAETdcSzcc_XTXlKawJ2JGk44W4WbQSHXnQn8KXWb2cE9WCVprysMFSySGKykQM4oYgN_Q3hTHrlDe6rMqH8eoPY89TLa_kNfUTZRxVe4LA-Z9G1D8RVBQ4UfKKo0GY64ICJKJ2ZJZRftZz_djmpX_Ye_twQ7a136m4OoPtdx4wkL-ZH1righ7Jxv52xsjj1k3l8rSJmrcylS8VKgcs7bOHBj9uj7kVQ',
            class_name: '8º Ano B',
            school_level: 'Ensino Fundamental',
            school_name: 'SESI Campanha'
        },
        {
            rm: '12346',
            email: 'maria@sesi.edu.br',
            password_hash: defaultPassword,
            name: 'Maria Oliveira',
            class_name: '8º Ano B',
            school_level: 'Ensino Fundamental',
            school_name: 'SESI Campanha'
        },
        {
            rm: '12347',
            email: 'pedro@sesi.edu.br',
            password_hash: defaultPassword,
            name: 'Pedro Santos',
            class_name: '3º Ano A',
            school_level: 'Ensino Médio',
            school_name: 'SESI Campanha'
        },
        {
            rm: '12348',
            email: 'ana@sesi.edu.br',
            password_hash: defaultPassword,
            name: 'Ana Costa',
            class_name: '3º Ano A',
            school_level: 'Ensino Médio',
            school_name: 'SESI Campanha'
        },
        {
            rm: '12349',
            email: 'lucas@sesi.edu.br',
            password_hash: defaultPassword,
            name: 'Lucas Ferreira',
            class_name: '2º Ano B',
            school_level: 'Ensino Médio',
            school_name: 'SESI Campanha'
        },
        {
            rm: '12350',
            email: 'julia@sesi.edu.br',
            password_hash: defaultPassword,
            name: 'Júlia Mendes',
            class_name: '1º Ano C',
            school_level: 'Ensino Médio',
            school_name: 'SESI Campanha'
        },
        {
            rm: '12351',
            email: 'gabriel@sesi.edu.br',
            password_hash: defaultPassword,
            name: 'Gabriel Rocha',
            class_name: '9º Ano A',
            school_level: 'Ensino Fundamental',
            school_name: 'SESI Campanha'
        },
        {
            rm: '12352',
            email: 'isabela@sesi.edu.br',
            password_hash: defaultPassword,
            name: 'Isabela Lima',
            class_name: '7º Ano A',
            school_level: 'Ensino Fundamental',
            school_name: 'SESI Campanha'
        },
        {
            rm: '12353',
            email: 'mateus@sesi.edu.br',
            password_hash: defaultPassword,
            name: 'Mateus Almeida',
            class_name: '6º Ano C',
            school_level: 'Ensino Fundamental',
            school_name: 'SESI Campanha'
        }
    ];

    const { data: insertedStudents, error: studentError } = await supabase
        .from('students')
        .upsert(students, { onConflict: 'rm' })
        .select();

    if (studentError) {
        console.error('Erro ao criar alunos:', studentError.message);
        return;
    }
    console.log(`  ✅ ${insertedStudents.length} alunos criados`);

    // ── 3. Criar registros de leitura (últimos 14 dias) ──
    console.log('\n📖 Criando registros de leitura...');

    const books = [
        { title: 'O Pequeno Príncipe', author: 'Antoine de Saint-Exupéry' },
        { title: 'Dom Casmurro', author: 'Machado de Assis' },
        { title: 'O Cortiço', author: 'Aluísio Azevedo' },
        { title: 'Vidas Secas', author: 'Graciliano Ramos' },
        { title: 'A Hora da Estrela', author: 'Clarice Lispector' },
        { title: 'Capitães da Areia', author: 'Jorge Amado' },
        { title: 'Aritmética Divertida', author: 'Material Didático SESI' },
        { title: 'Iracema', author: 'José de Alencar' },
        { title: 'Memórias Póstumas de Brás Cubas', author: 'Machado de Assis' },
        { title: 'O Alquimista', author: 'Paulo Coelho' },
    ];

    const readingLogs = [];

    for (const student of insertedStudents) {
        // Generate readings for last 14 days (random pattern)
        for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
            // ~70% chance of reading each day
            if (Math.random() > 0.3) {
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);
                const dateStr = date.toISOString().split('T')[0];

                const book = books[Math.floor(Math.random() * books.length)];
                const minutes = Math.floor(Math.random() * 14) + 3; // 3 to 16

                readingLogs.push({
                    student_id: student.id,
                    minutes: Math.min(minutes, 16),
                    date: dateStr,
                    book_title: book.title,
                    book_author: book.author
                });
            }
        }
    }

    // Insert in batches of 50
    for (let i = 0; i < readingLogs.length; i += 50) {
        const batch = readingLogs.slice(i, i + 50);
        const { error: logError } = await supabase.from('reading_logs').insert(batch);
        if (logError) {
            console.error(`Erro ao inserir leituras (batch ${i}):`, logError.message);
        }
    }

    console.log(`  ✅ ${readingLogs.length} registros de leitura criados`);

    // ── Summary ──
    console.log('\n══════════════════════════════════════');
    console.log('🎉 Seed concluído com sucesso!');
    console.log('══════════════════════════════════════');
    console.log('\n📋 Credenciais de teste:');
    console.log('   RM: 12345  |  Senha: 123456  (João Silva)');
    console.log('   RM: 12346  |  Senha: 123456  (Maria Oliveira)');
    console.log('   RM: 12347  |  Senha: 123456  (Pedro Santos)');
    console.log('\n🚀 Inicie o servidor com: npm start\n');
}

seed().catch(console.error);
