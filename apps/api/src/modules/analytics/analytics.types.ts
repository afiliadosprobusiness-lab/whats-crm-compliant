import type { UserRole } from "../auth/auth.types.js";
import type { LeadHealthTemperature, LeadStage } from "../leads/leads.types.js";

export type ProductivityStageFunnelItem = {
  stage: LeadStage;
  count: number;
  percentage: number;
};

export type ProductivityAgentItem = {
  userId: string;
  name: string;
  role: UserRole;
  assignedLeads: number;
  openLeads: number;
  wonLeads: number;
  hotLeads: number;
  overdueLeads: number;
  firstResponseBreaches: number;
  followupBreaches: number;
};

export type ProductivityDashboard = {
  generatedAt: string;
  totals: {
    leads: number;
    assignedLeads: number;
    unassignedLeads: number;
    overdueLeads: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    campaigns: number;
    campaignsSent: number;
  };
  stageFunnel: ProductivityStageFunnelItem[];
  healthBreakdown: Record<LeadHealthTemperature, number>;
  conversion: {
    wonRate: number;
    lostRate: number;
    qualifiedRate: number;
    firstResponseOnTimeRate: number;
  };
  agents: ProductivityAgentItem[];
};
