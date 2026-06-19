// ============================================================
// DESAFIO 1 MILHÃO DE MINUTOS — BACKEND SERVER
// ============================================================
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// ── Supabase Client ──
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// ── Auth Middleware ──
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

// ── Helper: get today's date string (YYYY-MM-DD) ──
function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password, loginType } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Preencha todos os campos.' });
        }

        // Find student by RM or email
        let query;
        if (loginType === 'email') {
            query = supabase.from('students').select('*').eq('email', identifier).single();
        } else {
            query = supabase.from('students').select('*').eq('rm', identifier).single();
        }

        const { data: student, error } = await query;

        if (error || !student) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        const validPassword = await bcrypt.compare(password, student.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        const token = jwt.sign({ id: student.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            student: {
                id: student.id,
                name: student.name,
                rm: student.rm,
                email: student.email,
                avatar_url: student.avatar_url,
                class_name: student.class_name,
                school_level: student.school_level,
                school_name: student.school_name
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { rm, email, password, name, class_name, school_level, school_name } = req.body;

        if (!rm || !password || !name || !class_name) {
            return res.status(400).json({ error: 'Campos obrigatórios: rm, password, name, class_name' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const { data, error } = await supabase.from('students').insert({
            rm,
            email: email || null,
            password_hash,
            name,
            class_name,
            school_level: school_level || 'Ensino Fundamental',
            school_name: school_name || 'SESI Campanha'
        }).select().single();

        if (error) {
            if (error.message.includes('duplicate')) {
                return res.status(400).json({ error: 'RM ou e-mail já cadastrado.' });
            }
            return res.status(400).json({ error: error.message });
        }

        const token = jwt.sign({ id: data.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            student: {
                id: data.id,
                name: data.name,
                rm: data.rm,
                email: data.email,
                avatar_url: data.avatar_url,
                class_name: data.class_name,
                school_level: data.school_level,
                school_name: data.school_name
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================================================
// DASHBOARD ROUTE
// ============================================================

// GET /api/dashboard
app.get('/api/dashboard', authMiddleware, async (req, res) => {
    try {
        // Get student info
        const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('id', req.userId)
            .single();

        if (!student) {
            return res.status(404).json({ error: 'Estudante não encontrado.' });
        }

        // Get total school minutes (all students)
        const { data: allLogs } = await supabase
            .from('reading_logs')
            .select('minutes');
        const totalSchoolMinutes = allLogs?.reduce((sum, r) => sum + r.minutes, 0) || 0;

        // Get student total minutes
        const { data: studentLogs } = await supabase
            .from('reading_logs')
            .select('minutes')
            .eq('student_id', req.userId);
        const totalStudentMinutes = studentLogs?.reduce((sum, r) => sum + r.minutes, 0) || 0;

        // Get today's minutes
        const today = getTodayStr();
        const { data: todayLogs } = await supabase
            .from('reading_logs')
            .select('minutes')
            .eq('student_id', req.userId)
            .eq('date', today);
        const todayMinutes = todayLogs?.reduce((sum, r) => sum + r.minutes, 0) || 0;

        // Get weekly data (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 6);
        const weekStart = weekAgo.toISOString().split('T')[0];

        const { data: weekLogs } = await supabase
            .from('reading_logs')
            .select('minutes, date')
            .eq('student_id', req.userId)
            .gte('date', weekStart)
            .order('date');

        // Build weekly chart data
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayMinutes = weekLogs
                ?.filter(l => l.date === dateStr)
                .reduce((sum, r) => sum + r.minutes, 0) || 0;
            weeklyData.push({
                day: dayNames[d.getDay()],
                minutes: dayMinutes,
                isToday: i === 0
            });
        }

        // Get recent readings
        const { data: recentReadings } = await supabase
            .from('reading_logs')
            .select('*')
            .eq('student_id', req.userId)
            .order('created_at', { ascending: false })
            .limit(5);

        res.json({
            school: {
                totalMinutes: totalSchoolMinutes,
                goal: 1000000,
                percentage: Math.min(100, ((totalSchoolMinutes / 1000000) * 100)).toFixed(1),
                remaining: Math.max(0, 1000000 - totalSchoolMinutes)
            },
            student: {
                id: student.id,
                name: student.name,
                avatar_url: student.avatar_url,
                class_name: student.class_name,
                school_level: student.school_level,
                school_name: student.school_name,
                totalMinutes: totalStudentMinutes
            },
            today: {
                minutes: todayMinutes,
                goal: 16,
                percentage: Math.min(100, Math.round((todayMinutes / 16) * 100)),
                remaining: Math.max(0, 16 - todayMinutes)
            },
            weeklyChart: weeklyData,
            recentReadings: recentReadings?.map(r => ({
                id: r.id,
                book_title: r.book_title || 'Leitura registrada',
                book_author: r.book_author || '',
                minutes: r.minutes,
                date: r.date,
                created_at: r.created_at
            })) || []
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================================================
// READINGS ROUTES
// ============================================================

// POST /api/readings
app.post('/api/readings', authMiddleware, async (req, res) => {
    try {
        const { minutes, book_title, book_author } = req.body;

        if (!minutes || minutes < 1 || minutes > 16) {
            return res.status(400).json({ error: 'Minutos devem ser entre 1 e 16.' });
        }

        const today = getTodayStr();

        // Check today's total
        const { data: todayLogs } = await supabase
            .from('reading_logs')
            .select('minutes')
            .eq('student_id', req.userId)
            .eq('date', today);

        const todayTotal = todayLogs?.reduce((sum, r) => sum + r.minutes, 0) || 0;

        if (todayTotal + minutes > 16) {
            const remaining = 16 - todayTotal;
            return res.status(400).json({
                error: `Limite diário excedido. Você já registrou ${todayTotal} minutos hoje. Máximo restante: ${remaining} minutos.`
            });
        }

        const { data, error } = await supabase.from('reading_logs').insert({
            student_id: req.userId,
            minutes: parseInt(minutes),
            date: today,
            book_title: book_title || null,
            book_author: book_author || null
        }).select().single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            success: true,
            reading: data,
            todayTotal: todayTotal + minutes
        });
    } catch (err) {
        console.error('Reading error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/readings/today
app.get('/api/readings/today', authMiddleware, async (req, res) => {
    try {
        const today = getTodayStr();

        const { data: todayLogs } = await supabase
            .from('reading_logs')
            .select('minutes')
            .eq('student_id', req.userId)
            .eq('date', today);

        const todayTotal = todayLogs?.reduce((sum, r) => sum + r.minutes, 0) || 0;

        res.json({
            minutes: todayTotal,
            remaining: Math.max(0, 16 - todayTotal)
        });
    } catch (err) {
        console.error('Today readings error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================================================
// STATS ROUTE
// ============================================================

// GET /api/stats
app.get('/api/stats', authMiddleware, async (req, res) => {
    try {
        // Get all readings for this student
        const { data: allLogs } = await supabase
            .from('reading_logs')
            .select('minutes, date')
            .eq('student_id', req.userId)
            .order('date');

        if (!allLogs || allLogs.length === 0) {
            return res.json({
                totalMinutes: 0,
                streak: 0,
                readingDays: 0,
                dailyAverage: 0,
                monthlyWeeks: []
            });
        }

        const totalMinutes = allLogs.reduce((sum, r) => sum + r.minutes, 0);

        // Unique reading days
        const uniqueDays = [...new Set(allLogs.map(r => r.date))];
        const readingDays = uniqueDays.length;

        // Daily average
        const dailyAverage = readingDays > 0 ? parseFloat((totalMinutes / readingDays).toFixed(1)) : 0;

        // Calculate streak (consecutive days ending today or yesterday)
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sortedDays = uniqueDays.sort().reverse(); // most recent first

        let checkDate = new Date(today);
        // If the most recent log is not today, check if it's yesterday
        if (sortedDays.length > 0) {
            const lastLogDate = new Date(sortedDays[0] + 'T00:00:00');
            const diffFromToday = Math.round((today - lastLogDate) / (1000 * 60 * 60 * 24));
            if (diffFromToday > 1) {
                streak = 0; // streak broken
            } else {
                checkDate = diffFromToday === 0 ? new Date(today) : new Date(today);
                for (const dayStr of sortedDays) {
                    const logDate = new Date(dayStr + 'T00:00:00');
                    const diff = Math.round((checkDate - logDate) / (1000 * 60 * 60 * 24));

                    if (diff <= 1) {
                        streak++;
                        checkDate = new Date(logDate);
                    } else {
                        break;
                    }
                }
            }
        }

        // Monthly data (current month, by week)
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthLogs = allLogs.filter(r => {
            const d = new Date(r.date + 'T00:00:00');
            return d >= monthStart;
        });

        // Group by week of month
        const weeklyTotals = [0, 0, 0, 0, 0];
        monthLogs.forEach(r => {
            const d = new Date(r.date + 'T00:00:00');
            const weekIndex = Math.floor((d.getDate() - 1) / 7);
            if (weekIndex < 5) {
                weeklyTotals[weekIndex] += r.minutes;
            }
        });

        res.json({
            totalMinutes,
            streak,
            readingDays,
            dailyAverage,
            monthlyWeeks: weeklyTotals.map((total, i) => ({
                label: `Sem ${i + 1}`,
                minutes: total
            }))
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// ============================================================
// RANKING ROUTE
// ============================================================

// GET /api/ranking
app.get('/api/ranking', authMiddleware, async (req, res) => {
    try {
        // Get all classes
        const { data: classes } = await supabase.from('classes').select('*');

        if (!classes || classes.length === 0) {
            return res.json({ ranking: [], schoolTotal: 0, goal: 1000000, percentage: '0.0' });
        }

        // Build ranking: for each class, sum minutes from all students in that class
        const ranking = [];

        for (const cls of classes) {
            // Get student IDs in this class
            const { data: students } = await supabase
                .from('students')
                .select('id')
                .eq('class_name', cls.name);

            const studentIds = students?.map(s => s.id) || [];

            let totalMinutes = 0;
            if (studentIds.length > 0) {
                const { data: logs } = await supabase
                    .from('reading_logs')
                    .select('minutes')
                    .in('student_id', studentIds);

                totalMinutes = logs?.reduce((sum, r) => sum + r.minutes, 0) || 0;
            }

            ranking.push({
                id: cls.id,
                name: cls.name,
                level: cls.level,
                teacher_name: cls.teacher_name,
                totalMinutes,
                studentCount: studentIds.length
            });
        }

        // Sort by totalMinutes descending
        ranking.sort((a, b) => b.totalMinutes - a.totalMinutes);

        // School total
        const { data: allLogs } = await supabase.from('reading_logs').select('minutes');
        const schoolTotal = allLogs?.reduce((sum, r) => sum + r.minutes, 0) || 0;

        res.json({
            ranking,
            schoolTotal,
            goal: 1000000,
            percentage: Math.min(100, ((schoolTotal / 1000000) * 100)).toFixed(1)
        });
    } catch (err) {
        console.error('Ranking error:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/classes
app.get('/api/classes', async (req, res) => {
    try {
        const { data: classes, error } = await supabase
            .from('classes')
            .select('id, name, level, teacher_name')
            .order('name');
        if (error) throw error;
        res.json(classes);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ error: 'Erro ao buscar turmas.' });
    }
});



module.exports = app;
