import type { AuthRepository } from "../auth/auth.repository.js";
import type { CampaignsRepository } from "../campaigns/campaigns.repository.js";
import type { Lead } from "../leads/leads.types.js";
import { leadHealthTemperatures, leadStages } from "../leads/leads.types.js";
import type { LeadsRepository } from "../leads/leads.repository.js";
import type { ProductivityAgentItem, ProductivityDashboard, ProductivityStageFunnelItem } from "./analytics.types.js";

const FIRST_RESPONSE_SLA_MINUTES = 30;
const FOLLOWUP_SLA_HOURS = 72;
const DEFAULT_HEALTH_SCORE = 50;

type LeadWithComputed = Lead & {
  ownerUserId: string | null;
  firstResponseAt: string | null;
  lastFollowupAt: string | null;
  healthScore: number;
  healthTemperature: "hot" | "warm" | "cold";
  sla: {
    firstResponseDueAt: string;
    firstResponseBreached: boolean;
    followupDueAt: string;
    followupBreached: boolean;
  };
};

export class AnalyticsService {
  constructor(
    private readonly leadsRepository: LeadsRepository,
    private readonly authRepository: AuthRepository,
    private readonly campaignsRepository: CampaignsRepository,
  ) {}

  public async getProductivity(workspaceId: string): Promise<ProductivityDashboard> {
    const [leadsRaw, users, campaigns] = await Promise.all([
      this.leadsRepository.list(workspaceId),
      this.authRepository.listUsersByWorkspace(workspaceId),
      this.campaignsRepository.list(workspaceId),
    ]);

    const leads = leadsRaw.map((lead) => this.decorateLead(lead));
    const totalLeads = leads.length;
    const assignedLeads = leads.filter((lead) => Boolean(lead.ownerUserId)).length;
    const unassignedLeads = totalLeads - assignedLeads;
    const overdueLeads = leads.filter(
      (lead) => lead.sla.firstResponseBreached || lead.sla.followupBreached,
    ).length;

    const healthBreakdown = {
      hot: leads.filter((lead) => lead.healthTemperature === "hot").length,
      warm: leads.filter((lead) => lead.healthTemperature === "warm").length,
      cold: leads.filter((lead) => lead.healthTemperature === "cold").length,
    } as const;

    const stageFunnel: ProductivityStageFunnelItem[] = leadStages.map((stage) => {
      const count = leads.filter((lead) => lead.stage === stage).length;
      return {
        stage,
        count,
        percentage: this.percentage(count, totalLeads),
      };
    });

    const wonCount = leads.filter((lead) => lead.stage === "won").length;
    const lostCount = leads.filter((lead) => lead.stage === "lost").length;
    const qualifiedCount = leads.filter((lead) => lead.stage === "qualified" || lead.stage === "won").length;
    const firstResponseMeasured = leads.filter((lead) => Boolean(lead.firstResponseAt)).length;
    const firstResponseOnTime = leads.filter((lead) => this.isFirstResponseOnTime(lead)).length;

    const agentItems: ProductivityAgentItem[] = users
      .map((user) => {
        const assigned = leads.filter((lead) => lead.ownerUserId === user.id);
        return {
          userId: user.id,
          name: user.name,
          role: user.role,
          assignedLeads: assigned.length,
          openLeads: assigned.filter(
            (lead) => lead.stage === "new" || lead.stage === "contacted" || lead.stage === "qualified",
          ).length,
          wonLeads: assigned.filter((lead) => lead.stage === "won").length,
          hotLeads: assigned.filter((lead) => lead.healthTemperature === "hot").length,
          overdueLeads: assigned.filter(
            (lead) => lead.sla.firstResponseBreached || lead.sla.followupBreached,
          ).length,
          firstResponseBreaches: assigned.filter((lead) => lead.sla.firstResponseBreached).length,
          followupBreaches: assigned.filter((lead) => lead.sla.followupBreached).length,
        };
      })
      .sort((a, b) => {
        if (b.assignedLeads !== a.assignedLeads) {
          return b.assignedLeads - a.assignedLeads;
        }
        if (b.wonLeads !== a.wonLeads) {
          return b.wonLeads - a.wonLeads;
        }
        return a.name.localeCompare(b.name);
      });

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        leads: totalLeads,
        assignedLeads,
        unassignedLeads,
        overdueLeads,
        hotLeads: healthBreakdown.hot,
        warmLeads: healthBreakdown.warm,
        coldLeads: healthBreakdown.cold,
        campaigns: campaigns.length,
        campaignsSent: campaigns.filter(
          (campaign) => campaign.status === "sent" || campaign.status === "sent_with_errors",
        ).length,
      },
      stageFunnel,
      healthBreakdown,
      conversion: {
        wonRate: this.percentage(wonCount, totalLeads),
        lostRate: this.percentage(lostCount, totalLeads),
        qualifiedRate: this.percentage(qualifiedCount, totalLeads),
        firstResponseOnTimeRate: this.percentage(firstResponseOnTime, firstResponseMeasured),
      },
      agents: agentItems,
    };
  }

  private decorateLead(lead: Lead): LeadWithComputed {
    const healthScore = this.normalizeHealthScore(lead.healthScore);
    const healthTemperature = this.normalizeHealthTemperature(lead.healthTemperature, healthScore);
    const ownerUserId = lead.ownerUserId ?? null;
    const firstResponseAt = lead.firstResponseAt ?? null;
    const lastFollowupAt = lead.lastFollowupAt ?? null;
    const createdAtMs = this.safeDateMs(lead.createdAt) ?? Date.now();
    const firstResponseDueAtMs = createdAtMs + FIRST_RESPONSE_SLA_MINUTES * 60 * 1000;
    const followupAnchorMs = this.safeDateMs(lastFollowupAt) ?? this.safeDateMs(firstResponseAt) ?? createdAtMs;
    const followupDueAtMs = followupAnchorMs + FOLLOWUP_SLA_HOURS * 60 * 60 * 1000;

    return {
      ...lead,
      ownerUserId,
      firstResponseAt,
      lastFollowupAt,
      healthScore,
      healthTemperature,
      sla: {
        firstResponseDueAt: new Date(firstResponseDueAtMs).toISOString(),
        firstResponseBreached:
          lead.stage === "new" && !firstResponseAt && Date.now() > firstResponseDueAtMs,
        followupDueAt: new Date(followupDueAtMs).toISOString(),
        followupBreached:
          (lead.stage === "contacted" || lead.stage === "qualified") && Date.now() > followupDueAtMs,
      },
    };
  }

  private normalizeHealthScore(score: number | undefined): number {
    if (typeof score !== "number" || !Number.isFinite(score)) {
      return DEFAULT_HEALTH_SCORE;
    }
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private normalizeHealthTemperature(
    current: Lead["healthTemperature"],
    score: number,
  ): "hot" | "warm" | "cold" {
    if (current && leadHealthTemperatures.includes(current)) {
      return current;
    }
    if (score >= 70) {
      return "hot";
    }
    if (score >= 40) {
      return "warm";
    }
    return "cold";
  }

  private isFirstResponseOnTime(lead: LeadWithComputed): boolean {
    if (!lead.firstResponseAt) {
      return false;
    }
    const firstResponseAtMs = this.safeDateMs(lead.firstResponseAt);
    const dueAtMs = this.safeDateMs(lead.sla.firstResponseDueAt);
    if (firstResponseAtMs === null || dueAtMs === null) {
      return false;
    }
    return firstResponseAtMs <= dueAtMs;
  }

  private safeDateMs(iso: string | null | undefined): number | null {
    if (!iso) {
      return null;
    }
    const value = new Date(iso).getTime();
    return Number.isNaN(value) ? null : value;
  }

  private percentage(part: number, total: number): number {
    if (!total) {
      return 0;
    }
    return Number(((part / total) * 100).toFixed(2));
  }
}
