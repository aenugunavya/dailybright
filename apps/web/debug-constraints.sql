-- Debug script to check actual constraints on the friends table
-- Run this in your Supabase SQL Editor to see what constraints actually exist

-- Check all constraints on the friends table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'friends' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Check the actual table definition
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'friends' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any triggers on the friends table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'friends' 
    AND trigger_schema = 'public';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'friends';
