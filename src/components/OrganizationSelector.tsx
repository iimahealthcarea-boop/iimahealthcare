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

interface Organization {
  id: string;
  name: string;
  domain?: string;
  is_verified: boolean;
}

interface OrganizationSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  value,
  onChange,
  placeholder = "Select organization...",
  disabled = false,
  required = false
}) => {
  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDomain, setNewOrgDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;


  const searchOrganizations = async (term: string) => {
    setLoading(true);
    try {
      const url = `${supabaseUrl}/functions/v1/organizations-search${term ? `?q=${encodeURIComponent(term)}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabasePublishableKey}`,
          'apikey': supabasePublishableKey,
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();

      if (data.success) {
        setOrganizations(data.data);
      }
    } catch (error) {
      console.error('Error searching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to search organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchOrganizations('');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchOrganizations(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleAddOrganization = async () => {
    if (!newOrgName.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke('organizations-add', {
        body: {
          name: newOrgName.trim(),
          domain: newOrgDomain.trim() || null,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        
        onChange(data.data.name);
        setNewOrgName('');
        setNewOrgDomain('');
        setShowAddForm(false);
        setOpen(false);
        searchOrganizations('');
      }
    } catch (error) {
      console.error('Error adding organization:', error);
      toast({
        title: "Error",
        description: "Failed to add organization",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const selectedOrg = organizations.find(org => org.name === value);

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
          {selectedOrg ? (
            <div className="flex items-center gap-2">
              <span>{selectedOrg.name}</span>
              {selectedOrg.is_verified && (
                <Check className="h-3 w-3 text-green-600" />
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
            placeholder="Search organizations..."
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
                    No organizations found
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddForm(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Organization
                  </Button>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === org.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span>{org.name}</span>
                    {org.is_verified && (
                      <Check className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                </CommandItem>
              ))}
              {organizations.length > 0 && (
                <CommandItem
                  onSelect={() => setShowAddForm(true)}
                  className="border-t"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Organization
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>

        {showAddForm && (
          <div className="border-t p-4 space-y-4">
            <div>
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Enter organization name"
                disabled={adding}
              />
            </div>
            <div>
              <Label htmlFor="org-domain">Domain (Optional)</Label>
              <Input
                id="org-domain"
                value={newOrgDomain}
                onChange={(e) => setNewOrgDomain(e.target.value)}
                placeholder="company.com"
                disabled={adding}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddOrganization}
                disabled={adding || !newOrgName.trim()}
                className="flex-1"
              >
                {adding ? "Adding..." : "Add"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewOrgName('');
                  setNewOrgDomain('');
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