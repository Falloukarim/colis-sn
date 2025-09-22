-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des organisations (tenants)
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'expired', 'suspended')),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table des utilisateurs
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'manager', 'agent')) DEFAULT 'agent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table clients
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table commandes
CREATE TABLE commandes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  statut TEXT CHECK (statut IN ('en_cours', 'disponible', 'remis')) DEFAULT 'en_cours',
  poids REAL,
  prix_kg DECIMAL(10, 2),
  montant_total DECIMAL(10, 2) GENERATED ALWAYS AS (poids * prix_kg) STORED,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  date_retrait TIMESTAMP WITH TIME ZONE
);

-- Table des notifications
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  commande_id UUID REFERENCES commandes(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('sms', 'whatsapp', 'email')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for organizations
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (id IN (SELECT organization_id FROM users WHERE users.id = auth.uid()));

-- Policies for users
CREATE POLICY "Users can view users in their organization" ON users
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid()));

-- Policies for clients
CREATE POLICY "Users can manage clients in their organization" ON clients
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid()));

-- Policies for commandes
CREATE POLICY "Users can manage commandes in their organization" ON commandes
  FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid()));

-- Policies for notifications
CREATE POLICY "Users can view notifications for their commandes" ON notifications
  FOR SELECT USING (commande_id IN (SELECT id FROM commandes WHERE organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())));