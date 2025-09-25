import { supabase } from "@/integrations/supabase/client";

export interface ProfileChange {
  id: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
  changeType: 'create' | 'update' | 'approve' | 'reject' | 'admin_edit';
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
    'address', 'date_of_birth', 'city', 'country', 'organization',
    'position', 'program', 'experience_level', 'organization_type',
    'graduation_year', 'bio', 'interests', 'skills', 'linkedin_url',
    'website_url', 'show_contact_info', 'show_location', 'is_public',
    'approval_status', 'rejection_reason'
  ]
): Record<string, { oldValue: unknown; newValue: unknown }> {
  const changes: Record<string, { oldValue: unknown; newValue: unknown }> = {};

  fieldsToTrack.forEach(field => {
    const oldValue = oldProfile[field];
    const newValue = newProfile[field];
    
    // Handle array comparison for interests and skills
    if (field === 'interests' || field === 'skills') {
      const oldArray = Array.isArray(oldValue) ? oldValue : [];
      const newArray = Array.isArray(newValue) ? newValue : [];
      
      if (JSON.stringify(oldArray.sort()) !== JSON.stringify(newArray.sort())) {
        changes[field] = { oldValue: oldArray, newValue: newArray };
      }
    } else if (oldValue !== newValue) {
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
  changeType: 'create' | 'update' | 'approve' | 'reject' | 'admin_edit' = 'update'
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
    return data?.map((change: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: change.id,
      updatedBy: change.changed_by,
      updatedByName: change.changed_by_name,
      updatedAt: change.changed_at,
      changeType: change.change_type as 'create' | 'update' | 'approve' | 'reject' | 'admin_edit',
      changedFields: change.changed_fields as Record<string, { oldValue: unknown; newValue: unknown }>
    })) || [];
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
    approval_status: 'Approval Status',
    rejection_reason: 'Rejection Reason'
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
    return value.length > 0 ? value.join(', ') : 'None';
  }

  if (fieldName === 'date_of_birth' && typeof value === 'string') {
    return new Date(value).toLocaleDateString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}
