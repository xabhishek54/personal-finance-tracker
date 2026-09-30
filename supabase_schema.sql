-- Personal Finance Tracker - Supabase SQL Schema
-- Run this script in the Supabase SQL Editor (https://app.supabase.com -> SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL DEFAULT 'personal',
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL, -- 'Income', 'Expense', 'Lend', 'Borrow'
    category TEXT NOT NULL,
    recipient TEXT,
    method TEXT NOT NULL,
    note TEXT,
    date TIMESTAMPTZ NOT NULL,
    settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 2. USER SETTINGS & WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    has_completed_onboarding BOOLEAN DEFAULT TRUE,
    has_unread_notifications BOOLEAN DEFAULT TRUE,
    require_password_for_delete BOOLEAN DEFAULT FALSE,
    pin_platforms JSONB DEFAULT '{"app": true, "mobileWeb": true, "desktopWeb": true}'::jsonb,
    workspaces JSONB DEFAULT '[{"id": "personal", "name": "Personal"}]'::jsonb,
    active_workspace_id TEXT DEFAULT 'personal',
    workspace_settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR TRANSACTIONS
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS POLICIES FOR USER SETTINGS
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON public.transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
