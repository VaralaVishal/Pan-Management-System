import React, { useEffect, useState } from "react";
import { getWholesalers, getPanshops } from "../api/api";

function ViewParties() {
  const [partyType, setPartyType] = useState("wholesaler");
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res =
          partyType === "wholesaler"
            ? await getWholesalers()
            : await getPanshops();
        setParties(res.data);
      } catch (err) {
        alert("Failed to load parties.");
        setParties([]);
      }
    };
    fetchData();
  }, [partyType]);

  const filtered = parties.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.mark || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.contact_info || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>View {partyType === "wholesaler" ? "Wholesalers" : "Pan Shops"}</h2>
      <label>Party Type:&nbsp;</label>
      <select value={partyType} onChange={e => setPartyType(e.target.value)}>
        <option value="wholesaler">Wholesaler</option>
        <option value="panshop">Pan Shop</option>
      </select>
      <input
        type="text"
        placeholder="Search by name, mark, or contact"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginLeft: 20, padding: 5 }}
      />
      <br /><br />
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Contact Info</th>
            {partyType === "wholesaler" && <th>Mark</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.contact_info}</td>
              {partyType === "wholesaler" && <td>{p.mark}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ViewParties;