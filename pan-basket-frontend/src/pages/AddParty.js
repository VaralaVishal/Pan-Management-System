import React, { useState } from "react";
import { addWholesaler, addPanshop } from "../api/api";

function AddParty() {
  const [partyType, setPartyType] = useState("wholesaler");
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [mark, setMark] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (partyType === "wholesaler") {
        await addWholesaler({ name, contact_info: contactInfo, mark });
        alert("Wholesaler added successfully!");
      } else {
        await addPanshop({ name, contact_info: contactInfo });
        alert("Pan shop added successfully!");
      }
      setName("");
      setContactInfo("");
      setMark("");
    } catch (err) {
      alert("Failed to add party.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add {partyType === "wholesaler" ? "Wholesaler" : "Pan Shop"}</h2>
      <label>Party Type:&nbsp;</label>
      <select value={partyType} onChange={e => setPartyType(e.target.value)}>
        <option value="wholesaler">Wholesaler</option>
        <option value="panshop">Pan Shop</option>
      </select>
      <form onSubmit={handleSubmit}>
        <br />
        <label>Name:</label><br />
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        /><br /><br />
        <label>Contact Info:</label><br />
        <input
          type="text"
          value={contactInfo}
          onChange={e => setContactInfo(e.target.value)}
        /><br /><br />
        {partyType === "wholesaler" && (
          <>
            <label>Basket Mark:</label><br />
            <input
              type="text"
              value={mark}
              onChange={e => setMark(e.target.value)}
              required
            /><br /><br />
          </>
        )}
        <button type="submit">Add {partyType === "wholesaler" ? "Wholesaler" : "Pan Shop"}</button>
      </form>
    </div>
  );
}

export default AddParty;