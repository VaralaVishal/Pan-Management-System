import React, { useEffect, useState } from "react";
import {
  getWholesalers,
  getPanshops,
  addPayment
} from "../api/api";

function AddPaymentEntry() {
  const [partyType, setPartyType] = useState("wholesaler");
  const [partyId, setPartyId] = useState("");
  const [parties, setParties] = useState([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [upiAccount, setUpiAccount] = useState("");

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res =
          partyType === "wholesaler"
            ? await getWholesalers()
            : await getPanshops();
        setParties(res.data);
      } catch (err) {
        alert("Failed to load parties.");
      }
    };
    fetchParties();
  }, [partyType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addPayment({
        party_type: partyType,
        party_id: parseInt(partyId),
        amount: parseFloat(amount),
        date,
        note,
        payment_mode: paymentMode,
        upi_account: paymentMode === "upi" ? upiAccount : null
      });
      alert("Payment recorded successfully!");
      setPartyId("");
      setAmount("");
      setDate("");
      setNote("");
      setPaymentMode("cash");
      setUpiAccount("");
    } catch (err) {
      alert("Failed to record payment.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Add Payment Entry</h2>
      <form onSubmit={handleSubmit}>
        <label>Party Type:</label>
        <select
          value={partyType}
          onChange={(e) => setPartyType(e.target.value)}
        >
          <option value="wholesaler">Wholesaler</option>
          <option value="panshop">Pan Shop</option>
        </select>
        <br /><br />

        <label>Party Name:</label>
        <select
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
          required
        >
          <option value="">-- Select --</option>
          {parties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <br /><br />

        <label>Amount:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <br /><br />

        <label>Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <br /><br />

        <label>Note (optional):</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <br /><br />

        <label>Payment Mode:</label>
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
        </select>
        <br /><br />

        {paymentMode === "upi" && (
          <>
            <label>UPI Account:</label>
            <input
              type="text"
              value={upiAccount}
              onChange={(e) => setUpiAccount(e.target.value)}
              required
            />
            <br /><br />
          </>
        )}

        <button type="submit">Add Payment</button>
      </form>
    </div>
  );
}

export default AddPaymentEntry;
