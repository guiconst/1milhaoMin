-- ============================================================
-- DESAFIO 1 MILHÃO DE MINUTOS — SCHEMA SQL (Supabase)
-- ============================================================

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABELA: classes ──
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABELA: students ──
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rm TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    class_name TEXT NOT NULL,
    school_level TEXT NOT NULL DEFAULT 'Ensino Fundamental',
    school_name TEXT NOT NULL DEFAULT 'SESI Campanha',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABELA: reading_logs ──
CREATE TABLE IF NOT EXISTS reading_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    minutes INTEGER NOT NULL CHECK (minutes >= 1 AND minutes <= 16),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    book_title TEXT,
    book_author TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ÍNDICES ──
CREATE INDEX IF NOT EXISTS idx_reading_logs_student_id ON reading_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_reading_logs_date ON reading_logs(date);
CREATE INDEX IF NOT EXISTS idx_reading_logs_student_date ON reading_logs(student_id, date);
CREATE INDEX IF NOT EXISTS idx_students_rm ON students(rm);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);
