-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CATEGORIES TABLE
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRANSACTIONS TABLE
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    remarks TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    total_amount DECIMAL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BUDGETS TABLE
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    limit_amount DECIMAL NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
    alert_threshold DECIMAL NOT NULL DEFAULT 80,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SPLIT GROUPS TABLE
CREATE TABLE split_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_amount DECIMAL NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SPLIT MEMBERS TABLE
CREATE TABLE split_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES split_groups(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    owed_amount DECIMAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'settled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_members ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" ON categories
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- Transactions Policies
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON transactions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- Budgets Policies
CREATE POLICY "Users can view their own budgets" ON budgets
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets" ON budgets
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" ON budgets
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" ON budgets
    FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- Split Groups Policies
CREATE POLICY "Users can view their own split groups" ON split_groups
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own split groups" ON split_groups
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own split groups" ON split_groups
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own split groups" ON split_groups
    FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- Split Members Policies
-- For split members, we join with split_groups to check the user_id
CREATE POLICY "Users can view their own split members" ON split_members
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM split_groups WHERE id = split_members.group_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create their own split members" ON split_members
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM split_groups WHERE id = group_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can update their own split members" ON split_members
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM split_groups WHERE id = split_members.group_id AND user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM split_groups WHERE id = group_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own split members" ON split_members
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM split_groups WHERE id = split_members.group_id AND user_id = auth.uid())
    );
