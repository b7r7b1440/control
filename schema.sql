
-- ======================================================
-- SEMS PRO v4.5 - FULL DATABASE REPAIR
-- ======================================================

-- 1. STAGES
CREATE TABLE IF NOT EXISTS stages (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    total_students INTEGER DEFAULT 0,
    prefix TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    student_id TEXT,
    stage_id BIGINT REFERENCES stages(id) ON DELETE CASCADE,
    grade TEXT,
    class TEXT,
    phone TEXT,
    seat_number TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. COMMITTEES
CREATE TABLE IF NOT EXISTS committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    capacity INTEGER DEFAULT 30,
    invigilator_count INTEGER DEFAULT 1,
    stage_counts JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    civil_id TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'TEACHER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. ENVELOPES
CREATE TABLE IF NOT EXISTS envelopes (
    id TEXT PRIMARY KEY,
    subject TEXT,
    committee_number TEXT,
    location TEXT,
    date DATE NOT NULL,
    grades JSONB DEFAULT '[]'::jsonb,
    start_time TEXT,
    end_time TEXT,
    period TEXT,
    status TEXT DEFAULT 'PENDING',
    students JSONB DEFAULT '[]'::jsonb,
    delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تعطيل نظام الحماية RLS مؤقتاً لضمان عمل الـ Fetch بدون مشاكل
ALTER TABLE stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE committees DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE envelopes DISABLE ROW LEVEL SECURITY;

-- وظيفة المسح الشامل
CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void AS $$
BEGIN
    TRUNCATE envelopes CASCADE;
    TRUNCATE students CASCADE;
    TRUNCATE stages CASCADE;
    TRUNCATE committees CASCADE;
    TRUNCATE teachers CASCADE;
END;
$$ LANGUAGE plpgsql;
