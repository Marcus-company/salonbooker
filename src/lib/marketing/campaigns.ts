// Marketing Service for Email Campaigns
// Helper functions for campaign management

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  template: string;
  content: string;
  segments: string[];
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: string;
  sentAt?: string;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  filter: (customer: any) => boolean;
}

// Parse template variables
export function parseTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// Campaign storage helpers (using localStorage for demo)
const STORAGE_KEY = 'salonbooker_campaigns';

export function getStoredCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveCampaign(campaign: Campaign): void {
  if (typeof window === 'undefined') return;
  const campaigns = getStoredCampaigns();
  const index = campaigns.findIndex(c => c.id === campaign.id);
  if (index >= 0) {
    campaigns[index] = campaign;
  } else {
    campaigns.push(campaign);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

export function deleteStoredCampaign(id: string): void {
  if (typeof window === 'undefined') return;
  const campaigns = getStoredCampaigns().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}
