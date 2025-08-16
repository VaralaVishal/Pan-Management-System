import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, Legend,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css";
import { getDashboardSummary } from "../api/api";

function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getDashboardSummary().then(res => setSummary(res.data));
  }, []);

  if (!summary) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">📦 Total Basket Value</h5>
              <p className="card-text">₹{summary.total_basket_value}</p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">💰 Total Amount Paid</h5>
              <p className="card-text">₹{summary.total_paid}</p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">❗ Total Outstanding Due</h5>
              <p className="card-text">₹{summary.total_due}</p>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">🧾 Total Transactions</h5>
              <p className="card-text">{summary.total_transactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Wholesalers by Due */}
      <h5>Top 5 Wholesalers by Due (What you have to pay)</h5>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={summary.top_wholesaler_dues}
          layout="vertical"
          margin={{ left: 40, right: 20, top: 20, bottom: 20 }}
        >
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Tooltip />
          <Bar dataKey="due" fill="#f87171" />
        </BarChart>
      </ResponsiveContainer>

      {/* Top 5 Pan Shops by Balance */}
      <h5 className="mt-5">Top 5 Pan Shops by Balance (What pan shops owe)</h5>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={summary.top_panshop_balances}
          layout="vertical"
          margin={{ left: 40, right: 20, top: 20, bottom: 20 }}
        >
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Tooltip />
          <Bar dataKey="balance" fill="#60a5fa" />
        </BarChart>
      </ResponsiveContainer>

      {/* Daily Basket Inflow/Outflow */}
      <h5 className="mt-5">Daily Basket Inflow / Outflow</h5>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={summary.daily_basket}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="inflow" stackId="1" stroke="#34d399" fill="#bbf7d0" name="Inflow (to Wholesalers)" />
          <Area type="monotone" dataKey="outflow" stackId="1" stroke="#f87171" fill="#fee2e2" name="Outflow (to Pan Shops)" />
        </AreaChart>
      </ResponsiveContainer>

      {/* Monthly Payment Trend */}
      <h5 className="mt-5">Monthly Payment Trend</h5>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={summary.monthly_payments}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="incoming" stroke="#34d399" name="Incoming (from Pan Shops)" />
          <Line type="monotone" dataKey="outgoing" stroke="#f87171" name="Outgoing (to Wholesalers)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Dashboard;