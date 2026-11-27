import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';

interface RevenueData {
  total_revenue: number;
  monthly_revenue: number;
  maintenance_cost: number;
  net_revenue: number;
  revenue_by_category: Record<string, number>;
  monthly_trend: Array<{
    month: string;
    month_name: string;
    amount: number;
    percentage: number;
  }>;
}

export default function RevenueReports() {
  const [report, setReport] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadReport() {
    setLoading(true);
    try {
      const data = await adminApi.getRevenueReport();
      if (data) {
        setReport(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch financial revenue statement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-muted-foreground">Compiling ledger balances and financial statements...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
        <p className="font-bold">Error loading financial statements</p>
        <p className="text-xs mt-1">{error || 'Could not retrieve financial data.'}</p>
      </div>
    );
  }

  const categoryEntries = Object.entries(report.revenue_by_category || {});
  const maxCatRev = Math.max(...Object.values(report.revenue_by_category || {}), 1);

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground">
            Financial & Revenue Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fleet gross billings, operational deductions, category yields, and net proceeds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReport}
            className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            ↻ Refresh Statement
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-primary/20 cursor-pointer"
          >
            🖨️ Export / Print Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-muted-foreground uppercase font-bold">Gross Revenue</span>
          <p className="font-display font-black text-2xl text-foreground mt-2">
            ₹{report.total_revenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Total customer rental receipts</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-muted-foreground uppercase font-bold">Maintenance & Repairs</span>
          <p className="font-display font-black text-2xl text-amber-600 mt-2">
            ₹{report.maintenance_cost.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Fleet servicing & workshop upkeep</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-muted-foreground uppercase font-bold">Net Operating Income</span>
          <p className="font-display font-black text-2xl text-emerald-600 mt-2">
            ₹{report.net_revenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Net gross margin after repairs</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-muted-foreground uppercase font-bold">Current Month</span>
          <p className="font-display font-black text-2xl text-primary mt-2">
            ₹{report.monthly_revenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Current billing cycle revenue</p>
        </div>
      </div>

      {/* Breakdown by Vehicle Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Share */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-display font-bold text-lg text-foreground mb-1">
            Revenue by Vehicle Class
          </h2>
          <p className="text-xs text-muted-foreground mb-6">Gross contributions across vehicle segments</p>

          {categoryEntries.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No category breakdown recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {categoryEntries.map(([category, amount]) => {
                const percentage = report.total_revenue > 0
                  ? Math.round((amount / report.total_revenue) * 100)
                  : 0;
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground capitalize">{category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-foreground">
                          ₹{amount.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max((amount / maxCatRev) * 100, 3)}%` }}
                        className="h-full bg-primary rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Operating Balance Summary */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-foreground mb-1">
              Financial Health Metrics
            </h2>
            <p className="text-xs text-muted-foreground mb-6">Operational ratios and profitability overview</p>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-muted/40 rounded-xl border border-border">
                <span className="text-muted-foreground font-bold">Operating Profit Margin</span>
                <span className="font-bold text-emerald-600">
                  {report.total_revenue > 0
                    ? `${((report.net_revenue / report.total_revenue) * 100).toFixed(1)}%`
                    : '100%'}
                </span>
              </div>

              <div className="flex justify-between p-3 bg-muted/40 rounded-xl border border-border">
                <span className="text-muted-foreground font-bold">Fleet Maintenance Ratio</span>
                <span className="font-bold text-amber-600">
                  {report.total_revenue > 0
                    ? `${((report.maintenance_cost / report.total_revenue) * 100).toFixed(1)}%`
                    : '0.0%'}
                </span>
              </div>

              <div className="flex justify-between p-3 bg-muted/40 rounded-xl border border-border">
                <span className="text-muted-foreground font-bold">Average Monthly Inflow</span>
                <span className="font-display font-bold text-foreground">
                  ₹{Math.round(report.total_revenue / 12).toLocaleString()} / mo
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary mt-6">
            💡 <strong>College Project Note:</strong> Figures are calculated dynamically from seeded and customer-created reservations in the SQLite database.
          </div>
        </div>
      </div>

      {/* 12-Month Table */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-display font-bold text-lg text-foreground mb-1">
          12-Month Revenue Ledger
        </h2>
        <p className="text-xs text-muted-foreground mb-6">Historical ledger summary by month</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground font-bold">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Month Name</th>
                <th className="py-3 px-4">Total Billings</th>
                <th className="py-3 px-4">Share of Year</th>
                <th className="py-3 px-4 text-right">Relative Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.monthly_trend.map(item => (
                <tr key={item.month} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-muted-foreground">{item.month}</td>
                  <td className="py-3 px-4 font-bold text-foreground">{item.month_name}</td>
                  <td className="py-3 px-4 font-display font-bold text-foreground">
                    ₹{item.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono font-bold">
                    {report.total_revenue > 0 ? `${((item.amount / report.total_revenue) * 100).toFixed(1)}%` : '0%'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block w-24 bg-muted h-2 rounded-full overflow-hidden">
                      <span
                        style={{ width: `${item.percentage}%` }}
                        className="block h-full bg-primary rounded-full"
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
