import { 
  Target, 
  Megaphone, 
  TrendingUp, 
  Users, 
  Settings, 
  DollarSign 
} from "lucide-react";

export interface Agent {
  name: string;
  status: "Active" | "Inactive" | "Paused";
  schedule?: "daily" | "weekly" | "monthly";
  canRunNow?: boolean;
  source?: "n8n" | "mastra";
}

export interface Department {
  id: string;
  title: string;
  description: string;
  icon: any;
  agentCount: number;
  agents: Agent[];
}

export const departmentsData: Department[] = [
  {
    id: "strategy",
    title: "Strategy",
    description: "Strategic planning & analysis",
    icon: Target,
    agentCount: 4,
    agents: [
      { name: "Market Positioning Plan", status: "Active", schedule: "weekly", canRunNow: true, source: "n8n" },
      { name: "Knowledge Bases (FAQ, Offers)", status: "Paused", canRunNow: true, source: "n8n" },
      { name: "Company Brain (RAG)", status: "Active", canRunNow: true, source: "n8n" },
      { name: "RAG Agent", status: "Active", canRunNow: true, source: "mastra" },
    ],
  },
  {
    id: "advertising",
    title: "Advertising",
    description: "Campaign management & optimization",
    icon: Megaphone,
    agentCount: 7,
    agents: [
      { name: "Deep Research Market Assessment", status: "Active", canRunNow: true, source: "n8n" },
      { name: "Facebook Ads Library Scraper", status: "Active", schedule: "daily", canRunNow: true, source: "n8n" },
      { name: "Facebook Ads Library Scraper", status: "Active", schedule: "daily", canRunNow: true, source: "mastra" },
      { name: "Ad Creative Strategist", status: "Inactive", canRunNow: true, source: "n8n" },
      { name: "Ad Account Creative Iteration", status: "Active", canRunNow: true, source: "mastra" },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    description: "Content & campaign creation",
    icon: TrendingUp,
    agentCount: 5,
    agents: [
      { name: "VSL Generator", status: "Active", canRunNow: true, source: "n8n" },
      { name: "Perfect Webinar Script", status: "Active", canRunNow: true, source: "n8n" },
      { name: "Perfect Webinar Creator", status: "Paused", canRunNow: true, source: "n8n" },
      { name: "Asset Creator", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Deep Research Scraping Tool", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Landing Page Copywriter", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Email Copywriter", status: "Active", canRunNow: true, source: "mastra" },
    ],
  },
  {
    id: "sales",
    title: "Sales",
    description: "Performance tracking & optimization",
    icon: Users,
    agentCount: 5,
    agents: [
      { name: "Setter Performance Closer", status: "Active", schedule: "daily", source: "n8n" },
      { name: "Sales/Finance Data Entry", status: "Active", schedule: "daily", canRunNow: true, source: "n8n" },
      { name: "Setter Transcript Grader", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Setter EOD Report Generator", status: "Active", schedule: "daily", source: "mastra" },
      { name: "Sales Rep Transcript Grader", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Closer EOD Report Generator", status: "Active", schedule: "daily", source: "mastra" },
      { name: "Sales Team Reporter", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Setter Team Reporter", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Case Studies GPT", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Follow-up Agent", status: "Active", canRunNow: true, source: "mastra" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    description: "Workflow automation & efficiency",
    icon: Settings,
    agentCount: 6,
    agents: [
      { name: "Process Automation Agent", status: "Active", schedule: "daily", source: "n8n" },
      { name: "Resource Optimization Agent", status: "Paused", schedule: "weekly", source: "n8n" },
      { name: "Quality Control Monitor", status: "Active", schedule: "daily", source: "n8n" },
      { name: "Meeting Notes Bot", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Email Agent", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Calendar Agent", status: "Active", canRunNow: true, source: "mastra" },
      { name: "LLM Swap", status: "Active", canRunNow: true, source: "mastra" },
      { name: "Project Management Agent", status: "Active", canRunNow: true, source: "mastra" },
    ],
  },
  {
    id: "financials",
    title: "Financials",
    description: "Financial planning & analysis",
    icon: DollarSign,
    agentCount: 4,
    agents: [
      { name: "Budget Forecasting Agent", status: "Active", schedule: "monthly", canRunNow: true, source: "n8n" },
      { name: "Expense Tracker", status: "Inactive", schedule: "daily", source: "n8n" },
      { name: "Revenue Analytics Agent", status: "Active", schedule: "weekly", canRunNow: true, source: "n8n" },
    ],
  },
];
