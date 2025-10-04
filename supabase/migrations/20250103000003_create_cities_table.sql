-- Create cities table
CREATE TABLE public.cities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    state_province TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Cities are viewable by everyone" 
ON public.cities 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert cities" 
ON public.cities 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update cities" 
ON public.cities 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_cities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON public.cities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cities_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_cities_name ON public.cities(name);
CREATE INDEX idx_cities_country ON public.cities(country);
CREATE INDEX idx_cities_state_province ON public.cities(state_province);

-- Insert some common cities
INSERT INTO public.cities (name, country, state_province) VALUES
('Mumbai', 'India', 'Maharashtra'),
('Delhi', 'India', 'Delhi'),
('Bangalore', 'India', 'Karnataka'),
('Chennai', 'India', 'Tamil Nadu'),
('Kolkata', 'India', 'West Bengal'),
('Hyderabad', 'India', 'Telangana'),
('Pune', 'India', 'Maharashtra'),
('Ahmedabad', 'India', 'Gujarat'),
('Jaipur', 'India', 'Rajasthan'),
('Lucknow', 'India', 'Uttar Pradesh'),
('New York', 'United States', 'New York'),
('Los Angeles', 'United States', 'California'),
('Chicago', 'United States', 'Illinois'),
('Houston', 'United States', 'Texas'),
('Phoenix', 'United States', 'Arizona'),
('London', 'United Kingdom', 'England'),
('Manchester', 'United Kingdom', 'England'),
('Birmingham', 'United Kingdom', 'England'),
('Toronto', 'Canada', 'Ontario'),
('Vancouver', 'Canada', 'British Columbia'),
('Sydney', 'Australia', 'New South Wales'),
('Melbourne', 'Australia', 'Victoria'),
('Singapore', 'Singapore', 'Singapore'),
('Dubai', 'United Arab Emirates', 'Dubai'),
('Hong Kong', 'Hong Kong', 'Hong Kong'),
('Tokyo', 'Japan', 'Tokyo'),
('Seoul', 'South Korea', 'Seoul'),
('Shanghai', 'China', 'Shanghai'),
('Beijing', 'China', 'Beijing'),
('Mumbai', 'India', 'Maharashtra')
ON CONFLICT (name) DO NOTHING;

-- Grant access to the table
GRANT SELECT, INSERT, UPDATE ON public.cities TO authenticated, anon;
