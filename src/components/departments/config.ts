import { DepartmentAgentRow, DepartmentKpi, SalesAgentRow, OptimizationProject } from "./types";

export type DepartmentConfig = {
  kpis: DepartmentKpi[];
  rows: DepartmentAgentRow[];
  // Optional department-specific fields
  salesRows?: SalesAgentRow[];
  healthPulse?: number;
  projects?: OptimizationProject[];
};

const strategyConfig: DepartmentConfig = {
  kpis: [
    { label: "Total Agents", value: "12", trend: { direction: "up", value: "+2%" } },
    { label: "Active Projects", value: "5", trend: { direction: "down", value: "-5%" } },
    { label: "Department Capacity", value: "85%", trend: { direction: "up", value: "+1.2%" } },
  ],
  rows: [
    {
      id: "john-doe",
      name: "John Doe",
      role: "Lead Strategist",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDrbBtS5ebG22L_xcA9gqb_2k3-GUvrt33NKq2lnEeHX4cIDa3q0oEJVgkhXd9jr5XEnXggzfrvtgQ-4CdXc83kdzfd_bimNWzNGemPDpddFQglHqkQaRYc9oWp-rWevbTe8jiLwGtDYBIxWdsAct9kAppoUXn7zXiABJuI9DFNoeugc06mszt0-1b_ZLrEArkMAp1uJ6jj1XIpf8OvviF15WJTxfEpZ4KWNA48CMD9EbnQaY8s2PapJXDKTGmJVQX8-kvs1-BFmPYR",
      status: "online",
      ongoingProjects: ["Q4 Market Analysis", "Competitor Research"],
      lastActive: "5 minutes ago",
    },
    {
      id: "jane-smith",
      name: "Jane Smith",
      role: "Data Analyst",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCoGl0MVvpVabO1-9xuXlmScdiWZBYutZm5_QVkVjJbweMEeVcS8CVCAY1ajltqLz9nseua_TRsIbeRZPW8IounjnfiH8vvT4NtvJlSnJYRdNOuE-Bfn13tMaglDgQAipkPWI94rn7EvCSHtZVdQmCSxzK-0zpegz7hNqU4ItM8_7zOR0qF72ThnkS_bFy63b6hG5z1YKbAxdkHkP1ATKwy8cyR76Pz0rOutIP8m6E0n-wutVFCcs8xH2oCnUoGQsllUulWugGw6NMN",
      status: "busy",
      ongoingProjects: ["Project Phoenix"],
      lastActive: "2 hours ago",
    },
    {
      id: "michael-johnson",
      name: "Michael Johnson",
      role: "Junior Strategist",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD-zz4FJRCrpk-T_HOp6rR7MlbGkXlcHbBVwnW27a_Eng9_XqOb2BUPrO0bUZVpap-sN5_yB7EqMrK6c2vhuHOo2lkRuK8LXXrKvfRkOpKYvOR4hNlpywnzs2z20KHAl_JmKfgo0XqmxZAL2GmPwha62vwNXGAUree3UR7IbllD8GVlw0JsaRoNOQPscMR79rmM-MnBBPy22VEe7S763XxqdsQAAy8wFWCGDe-b2GpwvHsC03E8Ne6J8t61fQpABpcNX0aNXlG3xlv-",
      status: "offline",
      ongoingProjects: ["New Client Onboarding"],
      lastActive: "Yesterday",
    },
    {
      id: "emily-davis",
      name: "Emily Davis",
      role: "Market Researcher",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBU10TZdWlWloPEaVOohNTyGKgfdzsjvlgALCYW4PvgfmkkjO0_uROWQgTL7XMJNBsOwBuUEoHic263_sHf2JCjSvlQUqkXegwWtpJHdiTn1PypmsiAn7cIPS7zLphjhjbj8g-CN72Y2SQDZ72ctIlE_R3GL9O74rsvigZsB7gsNcRKiSimCHLA7KinwYR470DrXYcYQUQdxa79t2FcA--skO6EhlawS2gxYPD0RFxQpbL_nguvq37dY_l8uLEe5hncseLxzap51jF0",
      status: "online",
      ongoingProjects: ["Competitor Research"],
      lastActive: "10 minutes ago",
    },
  ],
};

const marketingConfig: DepartmentConfig = {
  kpis: [
    { label: "Total Agents", value: "12", trend: { direction: "up", value: "+2 this month" } },
    { label: "Active Campaigns", value: "8", trend: { direction: "up", value: "+5% from last week" } },
    { label: "Department Health", value: "92%", trend: { direction: "down", value: "-1% from last week" } },
  ],
  rows: [
    {
      id: "jane-doe",
      name: "Jane Doe",
      role: "Content Manager",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAxZ39Ef-rzCumYSJwudf6rs8Guq47P9Zk_Kv5U8UC24kIuLFRC69HDQp6ezKm20wrODkPm8CDM3W5l9pP16wIuEQOjIrnUBznZZ0GwE-6tQJSVfsAInYhayk8rQJCmtuFgCPDp44-w_SyUiTwHKG-1CrauDTIEqKzJ-oUoTVhxHt8Oyfg785n0IC_pw_V1nWxap0VxZ_7Jluz32Qsn9iLp8gjF7ZOpbqn7vyq9kC8UYKE8vcw4TSlRzxoOuEQLirDiaD7klPl49PJ8",
      status: "online",
      ongoingProjects: ["Content Calendar", "Brand Campaigns"],
      lastActive: "3 minutes ago",
    },
    {
      id: "john-smith",
      name: "John Smith",
      role: "Campaign Specialist",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCBKklUpnKwU1xAZiZB5CKRPmjDY_wfV8qaCJW-D0VfpSyxyBDvvKii3WzzpKfDDZrsDKTYZ8lnxoQFd6TrX0ORBeyRIJdk7uNTc4-5OWM2qX9pURNi02_rxBFOnKqFJa3nXuQiqocA7ADHm9xMdfCH4nMCRAL7VUFh-yVJVdh_ZJq9sC1ritCVSv3r3Jx53sZ6NRFXNCk3hqCLjeg3xXdsdy80P4K3-y4ySJO_ovCoyFnjMaCGstm_Ys1xmr8eN0UGuJkdTto_ZNLy",
      status: "busy",
      ongoingProjects: ["Q4 Campaigns", "Google Ads"],
      lastActive: "25 minutes ago",
    },
    {
      id: "emily-white",
      name: "Emily White",
      role: "SEO Specialist",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCURxNMKdyIwYl5i9Dio-zlf3Lt5OCd9HREIY9BYR7AEvOqCtQlDomwpkwv4RaXF_GI1winbGsEuz0FvGoPXL6AX2pu_XYxZHfft742xd2LxCStM4XabSldmCsj5-ipPyC7GjMA9JYqM9XqE91aZXDEKSkylwZuSLAwiVcwcCz49nGrVj0iSVJUIMFpXsR58-QQixtEWro_Q3aVGz9k4lIKydhmKyvKOehzHS7FC3UJVpuxAZAweXWrfKSoPLEFLfqDRsyim5R_tVkk",
      status: "offline",
      ongoingProjects: ["SEO Audit"],
      lastActive: "On leave",
    },
  ],
};

const advertisingConfig: DepartmentConfig = {
  kpis: [
    { label: "Total Agents", value: "42" },
    { label: "Active Campaigns", value: "18" },
    { label: "Total Ad Spend", value: "$250,600", trend: { direction: "up", value: "+5.2%" } },
    { label: "Department Health", value: "95%" },
  ],
  // Table on the Advertising Department is specialized; rows are not used here.
  rows: [],
};

const salesConfig: DepartmentConfig = {
  kpis: [
    { label: "Total Monthly Revenue", value: "$1,250,000", trend: { direction: "up", value: "+5.2%" } },
    { label: "New Leads Acquired", value: "842", trend: { direction: "up", value: "+10.1%" } },
    { label: "Average Deal Size", value: "$12,300", trend: { direction: "down", value: "-1.5%" } },
    { label: "Team Close Rate", value: "28.5%", trend: { direction: "up", value: "+2.3%" } },
  ],
  rows: [],
  salesRows: [
    {
      id: "john-doe",
      name: "John Doe",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAgQlvFP2SqFRUi-6VDgSseTpunekFIQZfSubw4W0ChFEEoe8smMe-QyN5NQokA1Mj_5r5UHMsYiiA9wHMLV4YrXWgf9L8BrZMVkPJ-LzTvrByrMt_3wRthZPxbQ3jSg-WJdSN17BK9ZCnqrJqdzYsJKcEmYgxdndxfeCNIuo2NWyMzr9qTkvwuCf-HtVs20YuZcuBnczAjrR_R95VXh5KLV31sqiM-82WNIO9WFJUC28xy4nxPvEijszund-zXTm3-b7th8i8jZG0C",
      status: "online",
      salesVolume: "$75k",
      salesPercent: 75,
      closeRate: "35%",
      activeLeads: 24,
    },
    {
      id: "jane-smith",
      name: "Jane Smith",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCIkF8n79XCSecfFOKcX2MwFSALD4l7sB9yukF_0x-buCpBag_2EO6hYFUwcttIVr26Pq_-Min3iNz6nZNURZK1gWU_rA6pa2A3296e4UJKq7ZZpUW27xVo3JXT0-8UqXxO2zMckAuQgKpRVtQNQeyRUzHxBuA0rw8NIdYvVk7ZiGUFzhhExsdHOzFB3LPWuKaDCGemWkFaYKvzvAN7vjtd1xwH79oGdIwlhqASlDCIyI991LxP3O6QXQ1Tdv7l030g2W0v2IUu6knn",
      status: "busy",
      salesVolume: "$90k",
      salesPercent: 90,
      closeRate: "42%",
      activeLeads: 31,
    },
    {
      id: "michael-chen",
      name: "Michael Chen",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC8RLGowj3AmuW2LVt7rBAEt-TyOt39eFd0gp3ezp2uDXMPoex5z5MNEf869BRSI1D7gqWj5qoHrAe2xKzyF2YBvclfpZlU_I0QQJ3_G7H6vvLJLiehhEc8sTkjIEmSHzM1Pq7wktsLgmfqQNOz3l3Ux5yJslXAZPnGM-lgKwNDBrTeP8rVQFpI3UbXi_dg3oTc4RlON2joMIsLTXAbiYugNiSwHYWUbrZ82dRu7ovhAHO9YskTK_kxoIFyLT09GKqRwx2pUgRQ7gGS",
      status: "offline",
      salesVolume: "$60k",
      salesPercent: 60,
      closeRate: "29%",
      activeLeads: 18,
    },
  ],
  healthPulse: 85,
  projects: [
    {
      name: "Q3 Lead Nurturing Campaign",
      status: "in-progress",
      progress: 65,
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuByj1LhZY8GY6eGlnEXOR_cI1E3TgdJYQr430GgtZ4iwn046Df5YjDsz-6EKAqboQrsAwCaiw9grwkICO6aLUkmSmOuiSbKBMZZGLV7psmzog_oqKc3OVhCknitbACsynjWwpuzgb9CwbPzsLEyed79IcdbkxWBZl2lzVaHewsih3sJSSUuVQlhYzHhnbQdV6P5UlZMKEKNIN_59BT-sO537wvpDTwMO_13umbfG5X11hTJcvlJsCARS5AfPruP3q56knG4k8pS4kLn",
    },
    {
      name: "New CRM Integration",
      status: "completed",
      progress: 100,
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBiiZc8Ry5KCBsvIz6U0davCPqO_K7p_pDaQcg77egleV0BwXf-3svrq0oG0VXmw5gESiL1t0z2W-2Pz4xdchshIbM-sVr6iX9_z0obSzigx2H9c44SMxldSJRB2akezGj9cxrMwCcBQPXg2eijasqKeA7ZUe-T39MinpGDB3-fwZPOq3AHO1G0T77qKv_gmj4VJ0Xunx6cBfUEIDOc0I0klSKOEMfoONoWiB6T895-8BDvHbYAbscooCCAoN2gMHAyE0yp0dSxTwms",
    },
    {
      name: "Cold Call Script A/B Test",
      status: "in-progress",
      progress: 20,
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCwJ5l_Vb-f82huMF7U-OWoPXF8E1-hDCn35bIZny7qLHUDJ7L-fesCs4n7hB9z7stqdCW4ME_8EzDE5z8qov-Vq-5ntHLI_LV6gdCmefmD5tqFrVNR0coyeOgkI-t1-l8Jnid-DQ9ewv69knxLIu4PPzj9GHeJ0k9UgghrQzljN1t86Q4UtWXlS1Q_PPWaTp4VRB0Wwk1ETgfVnqGwjsTXz3IOoMyB89zCaO71ppvkX48qZbiG6wdGKUDJs64o3zcBsTlc4x5AONx-",
    },
  ],
};

const operationsConfig: DepartmentConfig = {
  kpis: [
    { label: "Active Agents", value: "10 / 12" },
    { label: "Automation Success", value: "94%" },
    { label: "Team Efficiency", value: "88%" },
  ],
  rows: [
    {
      id: "olivia-rhye",
      name: "Olivia Rhye",
      role: "Automation Specialist",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCp7I3X34xs2nAgaD4_ap28gmAfZb1KERd-LeW_aVqc-HE4Pfi44c-8x8QHEneiS6X9UU5bLeelULEu-QKL0vShKQunykPTefHSagWMHFgCCywD05msibM2tJww99b30caVvc5s_kFc31K3HdXwIYkwrHml6k5y_eWVdjvheFgxKmSJWn-Tvxatu-T-eqDgEfiwCrEx9hUPk5nbSlNhIUvml6dSmkIhquDM7VeVKiNCCxLGc-7-qI3OavPhynQf1k17mHJj4bdjb52w",
      status: "online",
      ongoingProjects: ["Workflow Optimization", "SLA Monitoring"],
      lastActive: "just now",
    },
    {
      id: "phoenix-baker",
      name: "Phoenix Baker",
      role: "Process Analyst",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAjRA1FwwN92_D7D0lDu7xyHP8H--xZaBevmd8Pxf6B0fzqNvetNl49vLs68CjOdbxGIJ7uFxAptN6XIhYnuIGqt1fD5x817ArrPdi2LMNvmUpaScxDeLF2T4MwkxXcw0rWvvF6t05jV22NgEP4v5kzunvsFxGxQ3OeniIMV7ZdKWHZycdUjMK7KeRlUhOq8bN69YfW40tdID-usb3aKXJQcFSSOEzIgbT1QYqaoA7OwaDMMXhGsmTu4E5N8BOK5_61l_Dfgq8iak2F",
      status: "online",
      ongoingProjects: ["Process Mapping", "Data Cleanup"],
      lastActive: "8 minutes ago",
    },
    {
      id: "lana-steiner",
      name: "Lana Steiner",
      role: "Team Lead",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAdVTQbJxrd5r3RleaZtHIYlbjC-y72x4bUu0ZIKYPsczSyOV7do4mAjeO7l2KtYuxmxWBz6r7wojabKzcDrcVuZTGY0ylG_jxwW8uHRk0uoHkchUE9i_OL7EAHBnbNJMRnvjKekoDu5PdOL1f7SP27UApIS8qfzZzI_hqm-AORgdxjHbEEz79XO2vL9Tz1JIlYdSJMCxoRfThi_mAUf8ewUJREA3LeYFu4_xGq5dTPlMuC5u_BXt_CPMd-dDpctJYMssneu86IF4YI",
      status: "busy",
      ongoingProjects: ["Weekly Planning", "Team Coaching"],
      lastActive: "12 minutes ago",
    },
    {
      id: "demi-wilkinson",
      name: "Demi Wilkinson",
      role: "Data Entry Clerk",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDgmSdWWL1o7JFIv6fe8PxLQdDixLy_LGOmzn5aWynRsOx3jhAMMrs94NOylWBE9-CH_j4uG_8Q-BYpQy4-dNGsw9ssMSSikOKun7d-ECUPJLPiiH1n6aDpKPgFth6cWlBtaXw_CWZqM7DuT7-4ftk1kOKJ6Uv4cJNC9Ra-_6N_AEH1OhoOWjRXw5oDKFFeaUcBYc8RnApFCd-2A_E9wwvhO2-8kADdpAK-VfzhAOX6pBBebqOS4EJpx-Y04QCKOSNq65hX_ZsU-QE5",
      status: "offline",
      ongoingProjects: ["Backlog Cleanup"],
      lastActive: "yesterday",
    },
    {
      id: "candice-wu",
      name: "Candice Wu",
      role: "Support Agent",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAX2jkslwTXI5xIQum3hSM98p8dE5vfe9XtmLfZDRpwWqsNuQGyJ9DDieL1uqyJFhrp5G66nPOCEGqLu4-Huhy4YbHQm5h7Jj2ypsQuwtsgX146pAfVssaTWSLveu8_ZcNt7y24TfRlWe-MXxQw37fQ6YlC2s-5DQf2yk6i-u_jfhBv33yqdbFGkiB8FpYbt-Vv63LoQXQS7x7nerlI9amEiuDiH5frUu9KFTESocXHXgq1yrvncfxG5mx9YGR0KwFbz8c_ndezOuNV",
      status: "online",
      ongoingProjects: ["Ticket Triage"],
      lastActive: "5 minutes ago",
    },
    {
      id: "natali-craig",
      name: "Natali Craig",
      role: "Process Analyst",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDP73mx7MtF_hl6bltYzqjb33rRR4h-GalXpTo1ghiaovIpg_xUEH39uGSLRGTmsrrYUz4yYpV4gfCAaIlqQ8MVt5yh0LjDf7SAs5EziqKPsYpVjQ60oSWBWK_BSYcdZ2R4h7iiFyYBpvorhJInYQFImkjHLFiXUE-Hfa8HUlwUtJhTyfkR29pplFMVZdA1HmYwfr9Ziuyhx0O8LhW_UsdyAYUMgcnJYoT_t-V4PtomyMgm1l3mFGJatRGIlOmaXw0AJGBxkfHUTykA",
      status: "offline",
      ongoingProjects: ["QA Audits"],
      lastActive: "3 days ago",
    },
  ],
};

const configs: Record<string, DepartmentConfig> = {
  strategy: strategyConfig,
  marketing: marketingConfig,
  advertising: advertisingConfig,
  sales: salesConfig,
  operations: operationsConfig,
};

export function getDepartmentConfig(departmentId?: string): DepartmentConfig {
  if (departmentId && configs[departmentId]) {
    return configs[departmentId];
  }
  // default empty config to keep UI stable
  return {
    kpis: [],
    rows: [],
  };
}


