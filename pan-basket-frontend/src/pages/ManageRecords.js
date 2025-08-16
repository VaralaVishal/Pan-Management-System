import React, { useState, useEffect } from "react";
import axios from "axios";

function ManageRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterParty, setFilterParty] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [partyList, setPartyList] = useState({
    wholesalers: [],
    panshops: []
  });

  useEffect(() => {
    fetchParties();
    fetchRecords();
  }, [page, filterType, filterDate, filterParty]);

  const fetchParties = async () => {
    try {
      const [wholesalersRes, panshopsRes] = await Promise.all([
        axios.get("http://127.0.0.1:5000/api/wholesalers"),
        axios.get("http://127.0.0.1:5000/api/panshops")
      ]);
      
      setPartyList({
        wholesalers: wholesalersRes.data,
        panshops: panshopsRes.data
      });
    } catch (err) {
      console.error("Error fetching parties:", err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 10
      };
      
      if (filterType !== "all") {
        params.party_type = filterType;
      }
      
      if (filterDate) {
        params.date = filterDate;
      }
      
      if (filterParty) {
        params.party_id = filterParty;
      }
      
      const res = await axios.get("http://127.0.0.1:5000/api/basket-entries", { params });
      setRecords(res.data.entries);
      setTotalPages(Math.ceil(res.data.total / res.data.per_page));
    } catch (err) {
      console.error("Error fetching records:", err);
    }
    setLoading(false);
  };

  const handleEdit = (record) => {
    setEditingRecord({
      ...record,
      original_party_type: record.party_type,
      original_party_id: record.party_id
    });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    
    setUpdateLoading(true);
    try {
      const updateData = {
        ...editingRecord,
        update_related: true 
      };
      
      const res = await axios.put(`http://127.0.0.1:5000/api/basket-entries/${editingRecord.id}`, updateData);
      
      if (res.data.success) {
        alert(`Successfully updated record and ${res.data.related_updated || 0} related records.`);
        setEditingRecord(null);
        fetchRecords();
      } else {
        alert(`Update failed: ${res.data.message}`);
      }
    } catch (err) {
      console.error("Error updating record:", err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
    setUpdateLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getPartyName = (partyId, partyType) => {
    if (partyType === "wholesaler") {
      const wholesaler = partyList.wholesalers.find(w => w.id === partyId);
      return wholesaler ? `${wholesaler.name} (${wholesaler.mark})` : `ID: ${partyId}`;
    } else {
      const panshop = partyList.panshops.find(p => p.id === partyId);
      return panshop ? panshop.name : `ID: ${partyId}`;
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "auto" }}>
      <h2>Manage Basket Entry Records</h2>
      
      <div style={{ marginBottom: 20, padding: 15, backgroundColor: "#f8f9fa", borderRadius: 5 }}>
        <h4>Filter Records</h4>
        <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
          <div>
            <label>Type:&nbsp;</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="panshop">Pan Shop</option>
            </select>
          </div>
          
          <div>
            <label>Date:&nbsp;</label>
            <input 
              type="date" 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)}
            />
          </div>
          
          <div>
            <label>Party:&nbsp;</label>
            <select value={filterParty} onChange={e => setFilterParty(e.target.value)}>
              <option value="">All</option>
              {filterType === "all" || filterType === "wholesaler" ? (
                partyList.wholesalers.map(w => (
                  <option key={`w-${w.id}`} value={w.id}>{w.name} ({w.mark})</option>
                ))
              ) : null}
              {filterType === "all" || filterType === "panshop" ? (
                partyList.panshops.map(p => (
                  <option key={`p-${p.id}`} value={p.id}>{p.name}</option>
                ))
              ) : null}
            </select>
          </div>
          
          <button 
            onClick={() => {
              setFilterType("all");
              setFilterDate("");
              setFilterParty("");
            }}
            style={{
              padding: "5px 10px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}>Loading records...</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <thead>
                <tr style={{ backgroundColor: "#f2f2f2" }}>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>ID</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Date</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Party Type</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Party</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Mark</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Baskets</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Price/Basket</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Total</th>
                  <th style={{ padding: 10, border: "1px solid #ddd", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id} style={{ backgroundColor: record.id === editingRecord?.id ? "#e8f4f8" : "white" }}>
                    <td style={{ padding: 8, border: "1px solid #ddd" }}>{record.id}</td>
                    <td style={{ padding: 8, border: "1px solid #ddd" }}>{formatDate(record.date)}</td>
                    <td style={{ padding: 8, border: "1px solid #ddd" }}>
                      {record.party_type === "wholesaler" ? "Wholesaler" : "Pan Shop"}
                    </td>
                    <td style={{ padding: 8, border: "1px solid #ddd" }}>
                      {getPartyName(record.party_id, record.party_type)}
                    </td>
                    <td style={{ padding: 8, border: "1px solid #ddd" }}>{record.mark}</td>
                    <td style={{ padding: 8, border: "1px solid #ddd" }}>{record.basket_count}</td>
                    <td style={{ padding: 8, border: "1px solid #ddd" }}>₹{record.price_per_basket}</td>
                    <td style={{ padding: 8, border: "1px solid #ddd" }}>₹{record.total_price}</td>
                    <td style={{ padding: 8, border: "1px solid #ddd" }}>
                      <button
                        onClick={() => handleEdit(record)}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ padding: 20, textAlign: "center" }}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "5px 15px",
                backgroundColor: page === 1 ? "#e9ecef" : "#007bff",
                color: page === 1 ? "#6c757d" : "white",
                border: "none",
                borderRadius: "4px",
                cursor: page === 1 ? "default" : "pointer"
              }}
            >
              Previous
            </button>
            <span style={{ padding: "5px 10px" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "5px 15px",
                backgroundColor: page === totalPages ? "#e9ecef" : "#007bff",
                color: page === totalPages ? "#6c757d" : "white",
                border: "none",
                borderRadius: "4px",
                cursor: page === totalPages ? "default" : "pointer"
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
      
      {editingRecord && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 5,
            width: "90%",
            maxWidth: 600,
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3>Edit Record #{editingRecord.id}</h3>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", marginBottom: 5 }}>Party Type:</label>
              <select
                value={editingRecord.party_type}
                onChange={e => setEditingRecord({...editingRecord, party_type: e.target.value, party_id: ""})}
                style={{ width: "100%", padding: 8 }}
              >
                <option value="wholesaler">Wholesaler</option>
                <option value="panshop">Pan Shop</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", marginBottom: 5 }}>Party:</label>
              <select
                value={editingRecord.party_id}
                onChange={e => setEditingRecord({...editingRecord, party_id: e.target.value})}
                style={{ width: "100%", padding: 8 }}
              >
                <option value="">Select {editingRecord.party_type === "wholesaler" ? "Wholesaler" : "Pan Shop"}</option>
                {editingRecord.party_type === "wholesaler" ? (
                  partyList.wholesalers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.mark})</option>
                  ))
                ) : (
                  partyList.panshops.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                )}
              </select>
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", marginBottom: 5 }}>Mark:</label>
              <input
                type="text"
                value={editingRecord.mark}
                onChange={e => setEditingRecord({...editingRecord, mark: e.target.value})}
                style={{ width: "100%", padding: 8 }}
              />
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", marginBottom: 5 }}>Date:</label>
              <input
                type="date"
                value={editingRecord.date ? editingRecord.date.split('T')[0] : ""}
                onChange={e => setEditingRecord({...editingRecord, date: e.target.value})}
                style={{ width: "100%", padding: 8 }}
              />
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", marginBottom: 5 }}>Basket Count:</label>
              <input
                type="number"
                value={editingRecord.basket_count}
                onChange={e => {
                  const count = parseFloat(e.target.value) || 0;
                  setEditingRecord({
                    ...editingRecord, 
                    basket_count: count,
                    total_price: count * editingRecord.price_per_basket
                  });
                }}
                style={{ width: "100%", padding: 8 }}
              />
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", marginBottom: 5 }}>Price per Basket:</label>
              <input
                type="number"
                value={editingRecord.price_per_basket}
                onChange={e => {
                  const price = parseFloat(e.target.value) || 0;
                  setEditingRecord({
                    ...editingRecord, 
                    price_per_basket: price,
                    total_price: editingRecord.basket_count * price
                  });
                }}
                style={{ width: "100%", padding: 8 }}
              />
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", marginBottom: 5 }}>Total Price:</label>
              <input
                type="number"
                value={editingRecord.total_price}
                onChange={e => setEditingRecord({...editingRecord, total_price: parseFloat(e.target.value) || 0})}
                style={{ width: "100%", padding: 8 }}
              />
            </div>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={editingRecord.update_related}
                  onChange={e => setEditingRecord({...editingRecord, update_related: e.target.checked})}
                  style={{ marginRight: 8 }}
                />
                Update all related records with same mark
              </label>
              <p style={{ fontSize: 14, color: "#6c757d", margin: "5px 0 0 0" }}>
                If checked, all records with the same mark will be updated to use the new party.
              </p>
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRecord}
                disabled={updateLoading}
                style={{
                  padding: "8px 15px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: updateLoading ? "default" : "pointer"
                }}
              >
                {updateLoading ? "Updating..." : "Update Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageRecords; 