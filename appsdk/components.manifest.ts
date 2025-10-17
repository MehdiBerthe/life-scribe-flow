export interface ComponentEntry {
  id: string;
  path: string;
  name: string;
  description: string;
  url: string;
}

const baseUrl = process.env.LIFEX_COMPONENT_URL ?? "http://localhost:5174";

export const components: ComponentEntry[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    name: "Daily Focus Dashboard",
    description: "Interactive dashboard for daily goals, focus areas, and active signals.",
    url: `${baseUrl}/dashboard`
  },
  {
    id: "journal",
    path: "/journal",
    name: "Journal Entry",
    description: "Lightweight journaling interface for capturing moments and tagging insights.",
    url: `${baseUrl}/journal`
  },
  {
    id: "insights",
    path: "/insights",
    name: "Weekly Insights",
    description: "Trends and analytics summarizing weekly progress and signals.",
    url: `${baseUrl}/insights`
  }
];

const manifest = {
  version: 1,
  components
};

export default manifest;
