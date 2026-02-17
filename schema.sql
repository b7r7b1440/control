
-- ======================================================
-- SEMS PRO v4.6 - DATE SYNC FIX
-- ======================================================

DROP TABLE IF EXISTS envelopes CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS committees CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS stages CASCADE;

CREATE TABLE stages (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    total_students INTEGER DEFAULT 0,
    prefix TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    civil_id TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'TEACHER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    capacity INTEGER DEFAULT 30,
    invigilator_count INTEGER DEFAULT 1,
    stage_counts JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE envelopes (
    id TEXT PRIMARY KEY,
    subject TEXT,
    committee_number TEXT,
    location TEXT,
    date DATE NOT NULL, -- حقل تاريخ نقي
    grades JSONB DEFAULT '[]'::jsonb,
    start_time TEXT,
    end_time TEXT,
    period TEXT,
    status TEXT DEFAULT 'PENDING',
    students JSONB DEFAULT '[]'::jsonb,
    delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE committees DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE envelopes DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void AS $$
BEGIN
    TRUNCATE envelopes, committees, teachers, stages CASCADE;
END;
$$ LANGUAGE plpgsql;
