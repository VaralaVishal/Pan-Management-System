import React, { useEffect, useState, useCallback } from "react";
import { getBalanceSummary } from "../api/api";

function BalanceSummary() {
  const [partyType, setPartyType] = useState("wholesaler");
  const [summary, setSummary] = useState([]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getBalanceSummary({ party_type: partyType });
      console.log("Summary data from API:", res.data);
      setSummary(res.data);
    } catch (err) {
      console.error("❌ Error fetching summary:", err);
      alert("Failed to load data");
    }
  }, [partyType]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Balance Summary</h2>

      <label>Party Type: </label>
      <select value={partyType} onChange={(e) => setPartyType(e.target.value)}>
        <option value="wholesaler">Wholesaler</option>
        <option value="panshop">Pan Shop</option>
      </select>
      <br /><br />

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Party Name</th>
            <th>Total Basket Value</th>
            <th>Total Paid</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((item) => (
            <tr key={item.party_id}>
              <td>{item.party_name}</td>
              <td>{item.total_basket_value}</td>
              <td>{item.total_paid}</td>
              <td>{item.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BalanceSummary;
