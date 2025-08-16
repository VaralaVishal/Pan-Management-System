import React, { useEffect, useState } from "react";
import {
  getWholesalers,
  getPanshops,
  getTransactionHistory,
} from "../api/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";



function TransactionHistory() {
  const [partyType, setPartyType] = useState("wholesaler");
  const [parties, setParties] = useState([]);
  const [partyId, setPartyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [history, setHistory] = useState(null);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res =
          partyType === "wholesaler"
            ? await getWholesalers()
            : await getPanshops();
        setParties(res.data);
      } catch (err) {
        console.error("❌ Could not fetch party list:", err);
        alert("Could not fetch party list.");
      }
    };
    fetchParties();
  }, [partyType]);

  const handleSubmit = async () => {
    if (!partyId || !startDate || !endDate) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await getTransactionHistory({
        party_type: partyType,
        party_id: partyId,
        start_date: startDate,
        end_date: endDate,
      });
      setHistory(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch transaction history:", err);
      alert("Failed to fetch transaction history");
    }
  };

  const downloadExcel = (data) => {
    const wb = XLSX.utils.book_new();

    const basketSheet = XLSX.utils.json_to_sheet(data.baskets);
    XLSX.utils.book_append_sheet(wb, basketSheet, "Basket Entries");

    const paymentSheet = XLSX.utils.json_to_sheet(data.payments);
    XLSX.utils.book_append_sheet(wb, paymentSheet, "Payments");

    const summarySheet = XLSX.utils.json_to_sheet([data.summary]);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    XLSX.writeFile(wb, "Transaction_History.xlsx");
  };

  const downloadPDF = (data) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Transaction History", 14, 15);

  // Basket Table
  doc.setFontSize(12);
  doc.text("Basket Entries", 14, 25);
  doc.autoTable({
    startY: 30,
    head: [["Date", "Basket Count", "Price per Basket", "Total Price", "Mark"]],
    body: data.baskets.map((b) => [
      b.date,
      b.basket_count,
      b.price_per_basket,
      b.total_price,
      b.mark,
    ]),
  });

  // Payments Table
  const yAfterBasket = doc.lastAutoTable.finalY + 10;
  doc.text("Payments", 14, yAfterBasket);
  doc.autoTable({
    startY: yAfterBasket + 5,
    head: [["Date", "Amount", "Mode", "UPI", "Note"]],
    body: data.payments.map((p) => [
      p.date,
      p.amount,
      p.payment_mode,
      p.upi_account || "-",
      p.note || "-",
    ]),
  });

  // Summary
  const yAfterPayments = doc.lastAutoTable.finalY + 10;
  doc.text("Summary", 14, yAfterPayments);
  doc.autoTable({
    startY: yAfterPayments + 5,
    head: [["Total Basket Value", "Total Paid", "Balance"]],
    body: [[
      data.summary.total_basket_value,
      data.summary.total_paid,
      data.summary.balance,
    ]],
  });

  doc.save("Transaction_History.pdf");
};

  return (
    <div style={{ padding: "20px" }}>
      <h2>Transaction History</h2>

      <label>Party Type: </label>
      <select value={partyType} onChange={(e) => setPartyType(e.target.value)}>
        <option value="wholesaler">Wholesaler</option>
        <option value="panshop">Pan Shop</option>
      </select>
      <br /><br />

      <label>Select Party: </label>
      <select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
        <option value="">-- Select Party --</option>
        {parties.map((party) => (
          <option key={party.id} value={party.id}>
            {party.name}
          </option>
        ))}
      </select>
      <br /><br />

      <label>Start Date: </label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <br /><br />

      <label>End Date: </label>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
      <br /><br />

      <button onClick={handleSubmit}>Get History</button>

      <hr />

      {history && (
        <div>
          <h3>Basket Entries</h3>
          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>Date</th>
                <th>Basket Count</th>
                <th>Price per Basket</th>
                <th>Total Price</th>
                <th>Mark</th>
              </tr>
            </thead>
            <tbody>
              {history.baskets.map((b, i) => (
                <tr key={i}>
                  <td>{b.date}</td>
                  <td>{b.basket_count}</td>
                  <td>{b.price_per_basket}</td>
                  <td>{b.total_price}</td>
                  <td>{b.mark}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Payments</h3>
          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>UPI</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {history.payments.map((p, i) => (
                <tr key={i}>
                  <td>{p.date}</td>
                  <td>{p.amount}</td>
                  <td>{p.payment_mode}</td>
                  <td>{p.upi_account}</td>
                  <td>{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Summary</h3>
          <p><strong>Total Basket Value:</strong> ₹{history.summary.total_basket_value}</p>
          <p><strong>Total Paid:</strong> ₹{history.summary.total_paid}</p>
          <p><strong>Balance / Due:</strong> ₹{history.summary.balance}</p>

          <button onClick={() => downloadExcel(history)} style={{ marginRight: "10px" }}>
            Download Excel
          </button>
          <button onClick={() => downloadPDF(history)}>
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
