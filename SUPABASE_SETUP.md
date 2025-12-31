# Supabase Database Setup

## Prerequisites

1. Create a free Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard

## Database Schema

Run the following SQL in your Supabase SQL Editor to create the `clients` table:

```sql
-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Personal Information
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  dob DATE,
  sin VARCHAR(20),
  
  -- Contact Information
  phone_residence VARCHAR(20),
  phone_business VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Employment Information
  employer VARCHAR(255),
  occupation VARCHAR(255),
  
  -- Financial Information
  annual_income VARCHAR(50),
  net_worth VARCHAR(50),
  liquid_assets VARCHAR(50),
  
  -- Investment Profile
  investment_knowledge VARCHAR(50),
  risk_tolerance VARCHAR(50),
  investment_objective TEXT
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security requirements)
CREATE POLICY "Enable all operations for authenticated users" ON clients
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- If you want to allow anonymous access (not recommended for production)
-- CREATE POLICY "Enable all operations for all users" ON clients
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);
```

## Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Get your Supabase credentials from your project settings:
   - Go to Settings > API in your Supabase dashboard
   - Copy the Project URL and anon/public key

3. Update `.env.local` with your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Row Level Security (RLS)

The above SQL includes basic RLS policies. For production:

1. **Authenticated Access**: Uncomment the authenticated users policy
2. **User-specific Data**: Add policies that filter by user ID if you implement authentication
3. **Remove Anonymous Access**: Remove the "all users" policy if you have user authentication

Example policy for authenticated users:
```sql
CREATE POLICY "Users can only see their own clients" ON clients
  FOR SELECT
  USING (auth.uid() = user_id);
```

## Testing

After setting up:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the "Clients" section
3. Try adding a new client
4. Try editing an existing client
5. Verify the data persists in your Supabase dashboard

## Security Considerations

- Never commit `.env.local` to version control
- Use Row Level Security policies appropriate for your use case
- For production, implement proper authentication
- Consider encrypting sensitive fields like SIN
- Implement proper validation and sanitization
