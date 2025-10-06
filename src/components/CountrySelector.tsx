import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

interface CountrySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  countries: Country[];
  placeholder?: string;
  className?: string;
}

export default function CountrySelector({ 
  value, 
  onValueChange, 
  countries, 
  placeholder = "Select country",
  className = "w-32"
}: CountrySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries;
    
    return countries.filter(country => 
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
    );
  }, [countries, searchTerm]);

  const selectedCountry = countries.find(country => country.dialCode === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedCountry && (
            <span className="flex items-center gap-1">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.dialCode}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Search Input */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        
        {/* Country List */}
        <div className="max-h-60 overflow-y-auto">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country, index) => (
              <SelectItem key={`${country.code}-${country.dialCode}-${index}`} value={country.dialCode}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span className="font-medium">{country.dialCode}</span>
                  <span className="text-muted-foreground">{country.name}</span>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No countries found
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}

