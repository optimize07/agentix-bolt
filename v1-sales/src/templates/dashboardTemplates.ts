import { DashboardTemplate } from "@/types/dashboard";

export const dashboardTemplates: DashboardTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start with an empty dashboard and build from scratch',
    category: 'blank',
    preview: 'blank',
    widgets: []
  },
  {
    id: 'sales-overview',
    name: 'Sales Overview',
    description: 'Track revenue, orders, customers, and sales trends',
    category: 'sales',
    preview: 'sales',
    widgets: [
      {
        id: 'stat-1',
        type: 'statsCard',
        position: { x: 0, y: 0, w: 3, h: 1 },
        config: {
          title: 'Total Revenue',
          value: '$45,231',
          change: '+20.1%',
          trend: 'up'
        }
      },
      {
        id: 'stat-2',
        type: 'statsCard',
        position: { x: 3, y: 0, w: 3, h: 1 },
        config: {
          title: 'Orders',
          value: '1,234',
          change: '+12.5%',
          trend: 'up'
        }
      },
      {
        id: 'stat-3',
        type: 'statsCard',
        position: { x: 6, y: 0, w: 3, h: 1 },
        config: {
          title: 'Customers',
          value: '892',
          change: '+8.2%',
          trend: 'up'
        }
      },
      {
        id: 'stat-4',
        type: 'statsCard',
        position: { x: 9, y: 0, w: 3, h: 1 },
        config: {
          title: 'Conversion Rate',
          value: '3.24%',
          change: '-2.4%',
          trend: 'down'
        }
      },
      {
        id: 'chart-1',
        type: 'lineChart',
        position: { x: 0, y: 1, w: 8, h: 2 },
        config: {
          title: 'Revenue Trend',
          dataKey: 'revenue',
          xAxisKey: 'month'
        }
      },
      {
        id: 'chart-2',
        type: 'barChart',
        position: { x: 8, y: 1, w: 4, h: 2 },
        config: {
          title: 'Top Products',
          dataKey: 'sales',
          xAxisKey: 'product'
        }
      }
    ]
  },
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Monitor expenses, budget, and financial metrics',
    category: 'finance',
    preview: 'finance',
    widgets: [
      {
        id: 'stat-1',
        type: 'statsCard',
        position: { x: 0, y: 0, w: 4, h: 1 },
        config: {
          title: 'Total Budget',
          value: '$125,000',
          change: '+5.2%',
          trend: 'up'
        }
      },
      {
        id: 'stat-2',
        type: 'statsCard',
        position: { x: 4, y: 0, w: 4, h: 1 },
        config: {
          title: 'Expenses',
          value: '$87,430',
          change: '+12.3%',
          trend: 'up'
        }
      },
      {
        id: 'stat-3',
        type: 'statsCard',
        position: { x: 8, y: 0, w: 4, h: 1 },
        config: {
          title: 'Remaining',
          value: '$37,570',
          change: '-15.8%',
          trend: 'down'
        }
      },
      {
        id: 'chart-1',
        type: 'pieChart',
        position: { x: 0, y: 1, w: 6, h: 2 },
        config: {
          title: 'Expense Breakdown',
          dataKey: 'value'
        }
      },
      {
        id: 'chart-2',
        type: 'lineChart',
        position: { x: 6, y: 1, w: 6, h: 2 },
        config: {
          title: 'Monthly Comparison',
          dataKey: 'amount',
          xAxisKey: 'month'
        }
      }
    ]
  },
  {
    id: 'analytics-hub',
    name: 'Analytics Hub',
    description: 'Track website traffic, engagement, and user metrics',
    category: 'analytics',
    preview: 'analytics',
    widgets: [
      {
        id: 'stat-1',
        type: 'statsCard',
        position: { x: 0, y: 0, w: 3, h: 1 },
        config: {
          title: 'Total Visits',
          value: '24,567',
          change: '+18.2%',
          trend: 'up'
        }
      },
      {
        id: 'stat-2',
        type: 'statsCard',
        position: { x: 3, y: 0, w: 3, h: 1 },
        config: {
          title: 'Page Views',
          value: '89,234',
          change: '+25.1%',
          trend: 'up'
        }
      },
      {
        id: 'stat-3',
        type: 'statsCard',
        position: { x: 6, y: 0, w: 3, h: 1 },
        config: {
          title: 'Bounce Rate',
          value: '42.3%',
          change: '-5.4%',
          trend: 'down'
        }
      },
      {
        id: 'stat-4',
        type: 'statsCard',
        position: { x: 9, y: 0, w: 3, h: 1 },
        config: {
          title: 'Avg. Duration',
          value: '3m 24s',
          change: '+12.7%',
          trend: 'up'
        }
      },
      {
        id: 'chart-1',
        type: 'lineChart',
        position: { x: 0, y: 1, w: 12, h: 2 },
        config: {
          title: 'Traffic Over Time',
          dataKey: 'visits',
          xAxisKey: 'date'
        }
      }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Dashboard',
    description: 'Monitor online store performance and customer behavior',
    category: 'ecommerce',
    preview: 'ecommerce',
    widgets: [
      {
        id: 'stat-1',
        type: 'statsCard',
        position: { x: 0, y: 0, w: 3, h: 1 },
        config: {
          title: 'Total Sales',
          value: '$52,420',
          change: '+22.5%',
          trend: 'up'
        }
      },
      {
        id: 'stat-2',
        type: 'statsCard',
        position: { x: 3, y: 0, w: 3, h: 1 },
        config: {
          title: 'Active Users',
          value: '2,345',
          change: '+15.3%',
          trend: 'up'
        }
      },
      {
        id: 'stat-3',
        type: 'statsCard',
        position: { x: 6, y: 0, w: 3, h: 1 },
        config: {
          title: 'Cart Value',
          value: '$142.50',
          change: '+8.7%',
          trend: 'up'
        }
      },
      {
        id: 'stat-4',
        type: 'statsCard',
        position: { x: 9, y: 0, w: 3, h: 1 },
        config: {
          title: 'Abandoned Carts',
          value: '187',
          change: '-12.4%',
          trend: 'down'
        }
      },
      {
        id: 'chart-1',
        type: 'barChart',
        position: { x: 0, y: 1, w: 6, h: 2 },
        config: {
          title: 'Sales by Category',
          dataKey: 'sales',
          xAxisKey: 'category'
        }
      },
      {
        id: 'chart-2',
        type: 'pieChart',
        position: { x: 6, y: 1, w: 6, h: 2 },
        config: {
          title: 'Traffic Sources',
          dataKey: 'percentage'
        }
      }
    ]
  }
];
