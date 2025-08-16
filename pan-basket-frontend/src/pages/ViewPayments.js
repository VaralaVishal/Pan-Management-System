import React, { useEffect, useState } from "react";
import { getPayments } from "../api/api";

function ViewPayments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await getPayments();
        setPayments(res.data);
      } catch (err) {
        alert("Failed to load payments.");
        console.error(err);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>All Payments</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Party Type</th>
            <th>Party Name</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Note</th>
            <th>Mode</th>
            <th>UPI Account</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.party_type}</td>
              <td>{p.party_name}</td>
              <td>{p.amount}</td>
              <td>{p.date}</td>
              <td>{p.note}</td>
              <td>{p.payment_mode}</td>
              <td>{p.upi_account || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ViewPayments;
