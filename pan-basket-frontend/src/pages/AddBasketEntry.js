import React, { useEffect, useState } from "react";
import {
  addBasketEntry,
  getWholesalers,
  getPanshops,
} from "../api/api";

function AddBasketEntry() {
  const [partyType, setPartyType] = useState("wholesaler");
  const [parties, setParties] = useState([]);
  const [partyId, setPartyId] = useState("");
  const [basketCount, setBasketCount] = useState("");
  const [pricePerBasket, setPricePerBasket] = useState("");
  const [mark, setMark] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    async function fetchParties() {
      try {
        const response =
          partyType === "wholesaler"
            ? await getWholesalers()
            : await getPanshops();
        setParties(response.data);
      } catch (err) {
        console.error("Error loading parties", err);
      }
    }
    fetchParties();
  }, [partyType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addBasketEntry({
        party_type: partyType,
        party_id: parseInt(partyId),
        basket_count: parseInt(basketCount),
        price_per_basket: parseFloat(pricePerBasket),
        mark,
        date,
      });
      alert("Basket entry recorded!");
      setPartyId("");
      setBasketCount("");
      setPricePerBasket("");
      setMark("");
      setDate("");
    } catch (err) {
      alert("Failed to add basket entry");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px" }}>
      <h2>Add Basket Entry</h2>
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

        <label>Select Party:</label>
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

        <label>Basket Count:</label>
        <input
          type="number"
          value={basketCount}
          onChange={(e) => setBasketCount(e.target.value)}
          required
        />
        <br /><br />

        <label>Price per Basket:</label>
        <input
          type="number"
          value={pricePerBasket}
          onChange={(e) => setPricePerBasket(e.target.value)}
          required
        />
        <br /><br />

        <label>Basket Mark:</label>
        <input
          type="text"
          value={mark}
          onChange={(e) => setMark(e.target.value)}
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

        <button type="submit">Add Basket Entry</button>
      </form>
    </div>
  );
}

export default AddBasketEntry;
