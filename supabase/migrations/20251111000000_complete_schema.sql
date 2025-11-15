-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.installments CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.phone_contributions CASCADE;
DROP TABLE IF EXISTS public.phones CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;

-- Create partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capital DECIMAL(15,2) NOT NULL DEFAULT 0,
  available_capital DECIMAL(15,2) NOT NULL DEFAULT 0,
  initial_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  monthly_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  share DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create phones table (inventory)
CREATE TABLE public.phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  imei TEXT NOT NULL UNIQUE,
  purchase_price DECIMAL(15,2) NOT NULL,
  selling_price DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold')),
  purchase_date TIMESTAMPTZ DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  national_id TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT NOT NULL,
  phone_id UUID REFERENCES public.phones(id) ON DELETE RESTRICT NOT NULL,
  announced_price DECIMAL(15,2) NOT NULL,
  purchase_price DECIMAL(15,2) NOT NULL,
  down_payment DECIMAL(15,2) NOT NULL DEFAULT 0,
  installment_months INTEGER NOT NULL CHECK (installment_months > 0),
  monthly_interest_rate DECIMAL(5,4) NOT NULL DEFAULT 0.04,
  initial_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  sale_date TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted'))
);

-- Create installments table
CREATE TABLE public.installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  installment_number INTEGER NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  remaining_debt DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue'))
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('capital_add', 'capital_withdraw', 'initial_profit_withdraw', 'monthly_profit_withdraw', 'profit_to_capital')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  profit_type TEXT CHECK (profit_type IN ('initial', 'monthly', 'both')),
  date TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_sales_customer ON public.sales(customer_id);
CREATE INDEX idx_sales_phone ON public.sales(phone_id);
CREATE INDEX idx_installments_sale ON public.installments(sale_id);
CREATE INDEX idx_installments_status ON public.installments(status);
CREATE INDEX idx_installments_due_date ON public.installments(due_date);
CREATE INDEX idx_transactions_partner ON public.transactions(partner_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);

-- Enable Row Level Security
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all authenticated users full access)
CREATE POLICY "Allow all for authenticated users" ON public.partners FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.phones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.installments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create function to update phone status when sold
CREATE OR REPLACE FUNCTION public.update_phone_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.phones SET status = 'sold' WHERE id = NEW.phone_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_phone_status_trigger 
  AFTER INSERT ON public.sales 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_phone_status();

-- Create function to check overdue installments
CREATE OR REPLACE FUNCTION public.check_overdue_installments()
RETURNS void AS $$
BEGIN
  UPDATE public.installments 
  SET status = 'overdue' 
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.partners IS 'شرکای تجاری و سرمایه‌گذاران';
COMMENT ON TABLE public.phones IS 'موجودی گوشی‌های موبایل';
COMMENT ON TABLE public.customers IS 'مشتریان';
COMMENT ON TABLE public.sales IS 'فروش‌های اقساطی';
COMMENT ON TABLE public.installments IS 'اقساط ماهانه';
COMMENT ON TABLE public.transactions IS 'تراکنش‌های مالی شرکا';
