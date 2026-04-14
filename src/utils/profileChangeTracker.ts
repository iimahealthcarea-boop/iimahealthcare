import { supabase } from "@/integrations/supabase/client";

export interface ProfileChange {
  id: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
  changeType: 'create' | 'update' | 'approve' | 'reject' | 'admin_edit' | 'resubmit';
  changedFields: Record<string, { oldValue: unknown; newValue: unknown }>;
}

export interface ProfileChangeHistory {
  change_history: ProfileChange[];
}

/**
 * Compares two profile objects and returns the fields that have changed
 */
export function getChangedFields(
  oldProfile: Record<string, unknown>,
  newProfile: Record<string, unknown>,
  fieldsToTrack: string[] = [
    'first_name', 'last_name', 'email', 'phone', 'country_code',
    'address', 'date_of_birth', 'gender', 'pincode', 'location', 'city', 'country', 'organization',
    'position', 'program', 'experience_level', 'organization_type',
    'graduation_year', 'bio', 'interests', 'skills', 'linkedin_url',
    'website_url', 'show_contact_info', 'show_location', 'is_public',
    'preferred_mode_of_communication', 'organizations', 'willing_to_mentor', 'areas_of_contribution',
    'approval_status', 'rejection_reason'
  ]
): Record<string, { oldValue: unknown; newValue: unknown }> {
  const changes: Record<string, { oldValue: unknown; newValue: unknown }> = {};

  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      // For arrays of primitives, sort for stable comparison
      if (value.every(v => typeof v !== 'object')) {
        return [...value].map(v => String(v)).sort();
      }
      // For arrays of objects, normalize each object by sorted keys
      return (value as unknown[]).map((item) => {
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          const sortedEntries = Object.keys(obj).sort().map(k => [k, obj[k]] as const);
          return Object.fromEntries(sortedEntries);
        }
        return item;
      });
    }
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const sortedEntries = Object.keys(obj).sort().map(k => [k, normalize(obj[k])] as const);
      return Object.fromEntries(sortedEntries);
    }
    return value;
  };

  fieldsToTrack.forEach(field => {
    const oldValue = oldProfile[field];
    const newValue = newProfile[field];
    
    // Handle array comparison for arrays and complex JSON (including organizations)
    if (
      field === 'interests' ||
      field === 'skills' ||
      field === 'preferred_mode_of_communication' ||
      field === 'areas_of_contribution' ||
      field === 'organizations'
    ) {
      const oldNorm = normalize(oldValue);
      const newNorm = normalize(newValue);
      if (JSON.stringify(oldNorm) !== JSON.stringify(newNorm)) {
        changes[field] = { oldValue, newValue };
      }
    } else if (normalize(oldValue) !== normalize(newValue)) {
      changes[field] = { oldValue, newValue };
    }
  });

  return changes;
}

/**
 * Adds a change entry to the profile's change history
 */
export async function addProfileChange(
  profileUserId: string,
  changedBy: string,
  changedByName: string,
  changedFields: Record<string, { oldValue: unknown; newValue: unknown }>,
  changeType: 'create' | 'update' | 'approve' | 'reject' | 'admin_edit' | 'resubmit' = 'update'
): Promise<void> {
  try {
    console.log('Adding profile change:', {
      profileUserId,
      changedBy,
      changedByName,
      changedFields,
      changeType
    });

    const { data, error } = await supabase.rpc('add_profile_change', {
      profile_user_id: profileUserId,
      changed_by: changedBy,
      changed_by_name: changedByName,
      changed_fields: changedFields as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      change_type: changeType
    });

    if (error) {
      console.error('Error adding profile change:', error);
      throw error;
    }

    console.log('Profile change added successfully:', data);
  } catch (error) {
    console.error('Failed to track profile change:', error);
    // Don't throw here to avoid breaking the main update flow
  }
}

/**
 * Gets the change history for a profile
 */
export async function getProfileChangeHistory(profileUserId: string): Promise<ProfileChange[]> {
  try {
    const { data, error } = await supabase.rpc('get_profile_changes', {
      profile_user_id: profileUserId
    });

    if (error) {
      console.error('Error fetching change history:', error);
      return [];
    }

    // Transform the data to match our ProfileChange interface
    const changes = data?.map((change: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: change.id,
      updatedBy: change.changed_by,
      updatedByName: change.changed_by_name,
      updatedAt: change.changed_at,
      changeType: change.change_type as 'create' | 'update' | 'approve' | 'reject' | 'admin_edit' | 'resubmit',
      changedFields: change.changed_fields as Record<string, { oldValue: unknown; newValue: unknown }>
    })) || [];

    // Enrich with Name + Email for "Changed by" display
    const uniqueUserIds = [...new Set(changes.map(c => c.updatedBy).filter(Boolean))];
    if (uniqueUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', uniqueUserIds);

      if (profiles) {
        const profileMap = new Map(profiles.map(p => [p.user_id, p]));
        for (const change of changes) {
          const profile = profileMap.get(change.updatedBy);
          if (profile) {
            const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
            const email = profile.email || '';
            if (fullName && email) {
              change.updatedByName = `${fullName} (${email})`;
            } else if (fullName) {
              change.updatedByName = fullName;
            } else if (email) {
              change.updatedByName = email;
            }
          }
        }
      }
    }

    return changes;
  } catch (error) {
    console.error('Failed to fetch change history:', error);
    return [];
  }
}

/**
 * Gets user name by ID for change tracking
 */
export async function getUserName(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('get_user_name', {
      user_id: userId
    });

    if (error) {
      console.error('Error getting user name:', error);
      return 'Unknown User';
    }

    return data || 'Unknown User';
  } catch (error) {
    console.error('Failed to get user name:', error);
    return 'Unknown User';
  }
}

/**
 * Formats a field name for display
 */
export function formatFieldName(fieldName: string): string {
  const fieldMap: Record<string, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    country_code: 'Country Code',
    address: 'Address',
    date_of_birth: 'Date of Birth',
    gender: 'Gender',
    pincode: 'Pincode / ZIP',
    location: 'Location',
    city: 'City',
    country: 'Country',
    organization: 'Organization',
    position: 'Position',
    program: 'Program',
    experience_level: 'Experience Level',
    organization_type: 'Organization Type',
    graduation_year: 'Graduation Year',
    bio: 'Bio',
    interests: 'Interests',
    skills: 'Skills',
    linkedin_url: 'LinkedIn URL',
    website_url: 'Website URL',
    show_contact_info: 'Show Contact Info',
    show_location: 'Show Location',
    is_public: 'Public Profile',
    preferred_mode_of_communication: 'Preferred Communication',
    organizations: 'Organizations',
    willing_to_mentor: 'Willing to Mentor',
    areas_of_contribution: 'Areas of Contribution',
    approval_status: 'Approval Status',
    rejection_reason: 'Rejection Reason',
    privacy: 'Privacy Settings',
    status: 'Status'
  };

  return fieldMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formats a field value for display
 */
export function formatFieldValue(value: unknown, fieldName: string): string {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  if (Array.isArray(value)) {
    // If array of primitives
    if (value.every(v => typeof v !== 'object')) {
      return value.length > 0 ? (value as unknown[]).join(', ') as string : 'None';
    }
    // Array of objects (e.g., organizations) - format as readable text
    try {
      if (fieldName === 'organizations') {
        return (value as Record<string, unknown>[]).map((org, i) => {
          const parts: string[] = [];
          if (org.currentOrg) parts.push(String(org.currentOrg));
          if (org.currentPosition) parts.push(`Position: ${org.currentPosition}`);
          if (org.organizationType) parts.push(`Type: ${org.organizationType}`);
          if (org.experienceLevel) parts.push(`Experience: ${org.experienceLevel}`);
          return parts.length > 0 ? `${i + 1}. ${parts.join(' | ')}` : `${i + 1}. (empty)`;
        }).join('; ');
      }
      return (value as Record<string, unknown>[]).map((item, i) => {
        const entries = Object.entries(item)
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
        return entries.length > 0 ? `${i + 1}. ${entries.join(' | ')}` : `${i + 1}. (empty)`;
      }).join('; ');
    } catch {
      return '—';
    }
  }

  if (fieldName === 'date_of_birth' && typeof value === 'string') {
    return new Date(value).toLocaleDateString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Plain object (e.g., legacy privacy field stored as an object)
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    try {
      const obj = value as Record<string, unknown>;
      const entries = Object.entries(obj)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => {
          const label = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (typeof v === 'boolean') return `${label}: ${v ? 'Yes' : 'No'}`;
          return `${label}: ${String(v)}`;
        });
      return entries.length > 0 ? entries.join(', ') : 'None';
    } catch {
      return JSON.stringify(value);
    }
  }

  return String(value);
}
