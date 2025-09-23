-- Create organizations table
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  domain text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_verified boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view organizations" 
ON public.organizations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update organizations they created" 
ON public.organizations 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample organizations
INSERT INTO public.organizations (name, domain, is_verified) VALUES
('Google', 'google.com', true),
('Microsoft', 'microsoft.com', true),
('Apple', 'apple.com', true),
('Amazon', 'amazon.com', true),
('Meta', 'meta.com', true),
('Netflix', 'netflix.com', true),
('Tesla', 'tesla.com', true),
('Adobe', 'adobe.com', true),
('Salesforce', 'salesforce.com', true),
('Oracle', 'oracle.com', true);