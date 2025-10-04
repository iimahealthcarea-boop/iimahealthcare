import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface City {
  id: string;
  name: string;
  country: string;
  state_province?: string;
}

interface CitySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  country?: string; // Filter cities by country
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  value,
  onChange,
  placeholder = "Select city...",
  disabled = false,
  required = false,
  country
}) => {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('');
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const searchCities = async (term: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('cities')
        .select('*')
        .order('name');

      if (country) {
        query = query.eq('country', country);
      }

      if (term) {
        query = query.ilike('name', `%${term}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setCities(data || []);
    } catch (error) {
      console.error('Error searching cities:', error);
      toast({
        title: "Error",
        description: "Failed to search cities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchCities('');
  }, [country]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchCities(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, country]);

  const handleAddCity = async () => {
    if (!newCityName.trim()) {
      toast({
        title: "Error",
        description: "City name is required",
        variant: "destructive",
      });
      return;
    }

    if (!country) {
      toast({
        title: "Error",
        description: "Please select a country first",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert({
          name: newCityName.trim(),
          country: country,
          state_province: newCityState.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "City added successfully",
      });
      
      onChange(data.name);
      setNewCityName('');
      setNewCityState('');
      setShowAddForm(false);
      setOpen(false);
      searchCities('');
    } catch (error: any) {
      console.error('Error adding city:', error);
      if (error.code === '23505') {
        toast({
          title: "Error",
          description: "This city already exists",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add city",
          variant: "destructive",
        });
      }
    } finally {
      setAdding(false);
    }
  };

  const selectedCity = cities.find(city => city.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCity ? (
            <div className="flex items-center gap-2">
              <span>{selectedCity.name}</span>
              {selectedCity.state_province && (
                <span className="text-sm text-muted-foreground">
                  ({selectedCity.state_province})
                </span>
              )}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search cities..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                "Searching..."
              ) : (
                <div className="py-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    No cities found
                  </p>
                  {country ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddForm(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New City
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Please select a country first
                    </p>
                  )}
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  value={city.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span>{city.name}</span>
                    {city.state_province && (
                      <span className="text-sm text-muted-foreground">
                        ({city.state_province})
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
              {cities.length > 0 && country && (
                <CommandItem
                  onSelect={() => setShowAddForm(true)}
                  className="border-t"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New City
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>

        {showAddForm && country && (
          <div className="border-t p-4 space-y-4">
            <div>
              <Label htmlFor="city-name">City Name *</Label>
              <Input
                id="city-name"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                placeholder="Enter city name"
                disabled={adding}
              />
            </div>
            <div>
              <Label htmlFor="city-state">State/Province (Optional)</Label>
              <Input
                id="city-state"
                value={newCityState}
                onChange={(e) => setNewCityState(e.target.value)}
                placeholder="e.g., Maharashtra, California"
                disabled={adding}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Country: <strong>{country}</strong>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddCity}
                disabled={adding || !newCityName.trim()}
                className="flex-1"
              >
                {adding ? "Adding..." : "Add"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCityName('');
                  setNewCityState('');
                }}
                disabled={adding}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
