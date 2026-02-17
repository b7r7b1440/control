
-- ======================================================
-- SEMS PRO v4.0 - DATABASE ARCHITECTURE (Supabase)
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

-- 5. ENVELOPES (الجدول الحيوي للمسح الضوئي)
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

-- 6. SCHOOL SETTINGS
CREATE TABLE IF NOT EXISTS school_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT,
    manager_name TEXT,
    agent_name TEXT,
    year TEXT,
    term TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- وظيفة لمسح كافة بيانات النظام
CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void AS $$
BEGIN
    DELETE FROM envelopes;
    DELETE FROM students;
    DELETE FROM stages;
    DELETE FROM committees;
    DELETE FROM teachers;
END;
$$ LANGUAGE plpgsql;

-- تفعيل RLS
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE envelopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All" ON stages FOR ALL USING (true);
CREATE POLICY "Allow All" ON students FOR ALL USING (true);
CREATE POLICY "Allow All" ON committees FOR ALL USING (true);
CREATE POLICY "Allow All" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow All" ON envelopes FOR ALL USING (true);
