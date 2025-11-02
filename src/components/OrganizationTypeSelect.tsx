import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ORGANIZATION_TYPE_OPTIONS = [
  "Hospital / Clinic",
  "HealthTech Company",
  "Pharmaceutical",
  "Biotech",
  "Medical Devices",
  "Consulting Firm",
  "Public Health / Policy Organization",
  "Health Insurance",
  "Academic / Research Institution",
  "Startup / Entrepreneurial Venture",
  "Investment / Venture Capital",
  "Other",
] as const;

export type OrganizationType = typeof ORGANIZATION_TYPE_OPTIONS[number];

type OrganizationTypeSelectProps = {
  value?: OrganizationType | string;
  onValueChange: (value: OrganizationType) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
  name?: string;
};

export function OrganizationTypeSelect({
  value,
  onValueChange,
  placeholder = "Select organization type",
  disabled,
  error,
  className,
  id,
  name,
}: OrganizationTypeSelectProps) {
  // Ensure we have a valid default value
  const selectedValue = value || 'All Organization Types';
  
  return (
    <div className={className}>
      <Select value={selectedValue} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} name={name}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default OrganizationTypeSelect;
