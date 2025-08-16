import React, { useState, useEffect } from "react";
import axios from "axios";

function OCRUpload() {
  const [file, setFile] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [transactionType, setTransactionType] = useState("wholesaler");
  const [panShops, setPanShops] = useState([]);
  const [selectedPanShop, setSelectedPanShop] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showRawText, setShowRawText] = useState(false);
  const [autoCreateWholesaler, setAutoCreateWholesaler] = useState(true);
  const [wholesalers, setWholesalers] = useState([]);
  const [showWholesalers, setShowWholesalers] = useState(false);
  const [refreshingWholesalers, setRefreshingWholesalers] = useState(false);

  // Fetch pan shop list for dropdown
  useEffect(() => {
    if (transactionType === "panshop") {
      axios.get("http://127.0.0.1:5000/api/panshops")
        .then(res => setPanShops(res.data))
        .catch(() => setPanShops([]));
    } else if (transactionType === "wholesaler") {
      // Fetch wholesalers list
      fetchWholesalers();
    }
  }, [transactionType]);

  const fetchWholesalers = () => {
    setRefreshingWholesalers(true);
    axios.get("http://127.0.0.1:5000/api/wholesalers")
      .then(res => {
        setWholesalers(res.data);
        setRefreshingWholesalers(false);
      })
      .catch(() => {
        setWholesalers([]);
        setRefreshingWholesalers(false);
      });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setOcrText("");
    setParsedRows([]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image file.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post("http://127.0.0.1:5000/api/ocr/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setOcrText(res.data.text);
      
      // Debug: Show raw OCR text
      console.log("Raw OCR Text:", res.data.text);

      // Improved parsing with regex
      const lines = res.data.text.split("\n").filter(line => line.trim());
      console.log("Filtered Lines:", lines);
      
      const rows = lines.map(line => {
        // Updated regex to match format like "1200 BSMR 21-07-2025"
        // More flexible pattern to handle various spacing and formats
        const match = line.match(/^\s*(\d+[\d,\.]*)\s+([A-Za-z0-9]+)\s+([\d\-\.\/]+\s*\-?\s*[\d\-\.\/]*)\s*(.*)$/);
        console.log(`Line: "${line}" - Match:`, match);
        
        // If no match, try alternative pattern that might be more lenient
        if (!match) {
          // Try to identify numbers, words, and dates in the string
          const numberMatch = line.match(/\d+[\d,\.]*/);
          const wordMatch = line.match(/[A-Za-z0-9]{2,}/); // At least 2 characters
          const dateMatch = line.match(/\d{1,2}[\-\.\/]\d{1,2}[\-\.\/]\d{2,4}/);
          
          console.log("Pattern matches:", { 
            numberMatch: numberMatch ? numberMatch[0] : null,
            wordMatch: wordMatch ? wordMatch[0] : null,
            dateMatch: dateMatch ? dateMatch[0] : null
          });
          
          if (numberMatch && wordMatch) {
            return {
              amount: numberMatch ? numberMatch[0] : "",
              mark: wordMatch ? wordMatch[0] : "",
              date: dateMatch ? dateMatch[0] : "",
              extra: "",
              raw: line
            };
          }
          
          // Split by whitespace and try to identify parts by position
          const parts = line.trim().split(/\s+/);
          console.log(`No match for line "${line}". Parts:`, parts);
          
          if (parts.length >= 3) {
            // Assume first part is amount, second is mark, third is date
            const amount = parts[0].match(/^\d+[\d,\.]*$/) ? parts[0] : "";
            const mark = parts[1].match(/^[A-Za-z0-9]+$/) ? parts[1] : "";
            const date = parts[2].match(/[\d\-\.\/]+/) ? parts[2] : "";
            const extra = parts.slice(3).join(" ");
            
            console.log("Extracted from parts:", { amount, mark, date, extra });
            
            return {
              amount,
              mark,
              date,
              extra,
              raw: line
            };
          }
        }
        
        return {
          amount: match ? match[1] : "",
          mark: match ? match[2] : "",
          date: match ? match[3] : "",
          extra: match ? match[4].trim() : "",
          raw: line
        };
      }).filter(row => {
        // More lenient filtering - accept if we have at least amount and mark
        const valid = row.amount && row.mark;
        if (!valid) {
          console.log("Filtered out row:", row);
        }
        return valid;
      });
      
      console.log("Parsed Rows:", rows);
      
      setParsedRows(rows);
      
      if (rows.length === 0) {
        setErrorMessage("No valid data rows detected. You can add rows manually below.");
        // Add an empty row to start with
        setParsedRows([{ amount: "", mark: "", date: "", extra: "", raw: "" }]);
      }
    } catch (err) {
      alert("OCR failed.");
      console.error(err);
    }
    setLoading(false);
  };

  const validateRow = (row, idx) => {
    const errors = {};
    
    if (!row.amount.trim()) {
      errors.amount = "Required";
    } else if (isNaN(parseFloat(row.amount.replace(/,/g, '')))) {
      errors.amount = "Must be a number";
    }
    
    if (!row.mark.trim()) {
      errors.mark = "Required";
    }
    
    if (!row.date.trim()) {
      errors.date = "Required";
    } else {
      // Check date format (DD-MM-YYYY or DD/MM/YYYY)
      const datePattern = /^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/;
      if (!datePattern.test(row.date)) {
        errors.date = "Invalid format";
      } else {
        const matches = row.date.match(datePattern);
        const day = parseInt(matches[1], 10);
        const month = parseInt(matches[2], 10);
        
        if (day < 1 || day > 31) {
          errors.date = "Invalid day";
        }
        if (month < 1 || month > 12) {
          errors.date = "Invalid month";
        }
      }
    }
    
    return errors;
  };

  const handleRowChange = (idx, field, value) => {
    const newRows = [...parsedRows];
    newRows[idx][field] = value;
    setParsedRows(newRows);
    
    // Validate the changed row
    const rowErrors = validateRow(newRows[idx], idx);
    setValidationErrors(prev => ({
      ...prev,
      [idx]: rowErrors
    }));
  };

  const handleSave = async () => {
    if (transactionType === "panshop" && !selectedPanShop) {
      alert("Please select a Pan Shop.");
      return;
    }
    
    // Validate all rows before saving
    const allErrors = {};
    let hasErrors = false;
    
    parsedRows.forEach((row, idx) => {
      const rowErrors = validateRow(row, idx);
      if (Object.keys(rowErrors).length > 0) {
        allErrors[idx] = rowErrors;
        hasErrors = true;
      }
    });
    
    setValidationErrors(allErrors);
    
    if (hasErrors) {
      alert("Please fix validation errors before saving.");
      return;
    }
    
    setSaveLoading(true);
    try {
      console.log("Sending data to backend:", {
        rows: parsedRows,
        transactionType,
        panShopId: selectedPanShop,
        autoCreateWholesaler
      });
      
      const res = await axios.post("http://127.0.0.1:5000/api/ocr/save", {
        rows: parsedRows,
        transactionType,
        panShopId: selectedPanShop,
        autoCreateWholesaler
      });
      
      console.log("Backend response:", res.data);
      
      if (res.data.errors && res.data.errors.length > 0) {
        // Create a detailed error message
        const errorDetails = res.data.errors.map((err, index) => `Error ${index + 1}: ${err}`).join('\n');
        
        setErrorMessage(
          <div>
            <p>{res.data.message}</p>
            <p>The following errors occurred:</p>
            <pre style={{ 
              backgroundColor: "#ffebee", 
              padding: "10px", 
              borderRadius: "4px", 
              maxHeight: "200px", 
              overflowY: "auto",
              whiteSpace: "pre-wrap"
            }}>
              {errorDetails}
            </pre>
          </div>
        );
      } else {
        alert(res.data.message);
        setParsedRows([]);
        setFile(null);
        setOcrText("");
        setValidationErrors({});
        setErrorMessage("");
      }
    } catch (err) {
      console.error("Save error:", err);
      if (err.response && err.response.data) {
        console.error("Error response data:", err.response.data);
        setErrorMessage(`Failed to save data: ${err.response.data.error || err.message}`);
      } else {
        setErrorMessage(`Failed to save data: ${err.message}`);
      }
    }
    setSaveLoading(false);
  };

  const addEmptyRow = () => {
    setParsedRows([...parsedRows, { amount: "", mark: "", date: "", extra: "", raw: "" }]);
  };

  const removeRow = (idx) => {
    const newRows = [...parsedRows];
    newRows.splice(idx, 1);
    setParsedRows(newRows);
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h2>Upload Bill Image for OCR</h2>
      
      <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "5px", marginBottom: "20px", border: "1px solid #dee2e6" }}>
        <h4>Instructions:</h4>
        <ul>
          <li><strong>Required Format:</strong> The OCR works best when data is arranged in columns with the following order:
            <ul>
              <li><strong>Amount</strong> (required): Numeric value (e.g., 1200, 900)</li>
              <li><strong>Mark</strong> (required): Alphanumeric identifier (e.g., BSMR, NR)</li>
              <li><strong>Date</strong> (required): In format DD-MM-YYYY or DD/MM/YYYY</li>
            </ul>
          </li>
          <li><strong>Example:</strong> "1200 BSMR 21-07-2025"</li>
          <li><strong>Image Quality:</strong> Ensure clear, well-lit images with good contrast</li>
          <li><strong>Manual Entry:</strong> If OCR fails to detect data correctly, you can add or edit rows manually</li>
        </ul>
        
        <div style={{ marginTop: "15px", padding: "10px", border: "1px dashed #007bff", borderRadius: "5px" }}>
          <h5>Sample Format:</h5>
          <pre style={{ backgroundColor: "#fff", padding: "10px", borderRadius: "4px" }}>
            1200    BSMR    21-07-2025{"\n"}
            900     NR      20-07-2025{"\n"}
            1000    Nara    19-07-2025
          </pre>
        </div>
      </div>
      
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading} style={{ marginLeft: 10 }}>
        {loading ? "Processing..." : "Extract & Preview"}
      </button>
      
      {loading && (
        <div style={{ margin: "20px 0", textAlign: "center" }}>
          <div>Processing image, please wait...</div>
          <div style={{ width: "100%", height: "10px", backgroundColor: "#f3f3f3", borderRadius: "5px", margin: "10px 0" }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: "#4CAF50", borderRadius: "5px", animation: "pulse 1.5s infinite" }}></div>
          </div>
          <style>{`
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 1; }
              100% { opacity: 0.6; }
            }
          `}</style>
        </div>
      )}
      
      <div style={{ margin: "20px 0", padding: "15px", backgroundColor: "#e9ecef", borderRadius: "5px" }}>
        <h4>Manual Text Entry</h4>
        <p>If OCR doesn't work well with your image, you can paste or type the text here:</p>
        <textarea 
          style={{ 
            width: "100%", 
            height: "100px", 
            padding: "10px", 
            marginBottom: "10px",
            borderRadius: "4px",
            border: "1px solid #ced4da"
          }}
          placeholder="Enter your data here in the format:&#10;1200 BSMR 21-07-2025&#10;900 NR 20-07-2025"
          onChange={(e) => setOcrText(e.target.value)}
        />
        <button 
          onClick={() => {
            if (!ocrText.trim()) {
              alert("Please enter some text to parse");
              return;
            }
            
            // Use the same parsing logic as in handleUpload
            const lines = ocrText.split("\n").filter(line => line.trim());
            console.log("Manual Text - Filtered Lines:", lines);
            
            // Use the same parsing logic as in handleUpload
            const rows = lines.map(line => {
              const match = line.match(/^\s*(\d+[\d,\.]*)\s+([A-Za-z0-9]+)\s+([\d\-\.\/]+\s*\-?\s*[\d\-\.\/]*)\s*(.*)$/);
              
              if (!match) {
                // Try to identify numbers, words, and dates in the string
                const numberMatch = line.match(/\d+[\d,\.]*/);
                const wordMatch = line.match(/[A-Za-z0-9]{2,}/);
                const dateMatch = line.match(/\d{1,2}[\-\.\/]\d{1,2}[\-\.\/]\d{2,4}/);
                
                if (numberMatch && wordMatch) {
                  return {
                    amount: numberMatch ? numberMatch[0] : "",
                    mark: wordMatch ? wordMatch[0] : "",
                    date: dateMatch ? dateMatch[0] : "",
                    extra: "",
                    raw: line
                  };
                }
                
                const parts = line.trim().split(/\s+/);
                
                if (parts.length >= 3) {
                  const amount = parts[0].match(/^\d+[\d,\.]*$/) ? parts[0] : "";
                  const mark = parts[1].match(/^[A-Za-z0-9]+$/) ? parts[1] : "";
                  const date = parts[2].match(/[\d\-\.\/]+/) ? parts[2] : "";
                  const extra = parts.slice(3).join(" ");
                  
                  return {
                    amount,
                    mark,
                    date,
                    extra,
                    raw: line
                  };
                }
              }
              
              return {
                amount: match ? match[1] : "",
                mark: match ? match[2] : "",
                date: match ? match[3] : "",
                extra: match ? match[4].trim() : "",
                raw: line
              };
            }).filter(row => {
              return row.amount && row.mark;
            });
            
            console.log("Manual Text - Parsed Rows:", rows);
            
            setParsedRows(rows);
            
            if (rows.length === 0) {
              setErrorMessage("No valid data rows detected from manual text. You can add rows manually below.");
              setParsedRows([{ amount: "", mark: "", date: "", extra: "", raw: "" }]);
            }
          }}
          style={{ 
            padding: "8px 16px", 
            backgroundColor: "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Parse Manual Text
        </button>
      </div>
      
      <br /><br />
      <label>
        Transaction Type:&nbsp;
        <select value={transactionType} onChange={e => setTransactionType(e.target.value)}>
          <option value="wholesaler">Wholesaler</option>
          <option value="panshop">Pan Shop</option>
        </select>
      </label>
      {transactionType === "panshop" && (
        <label style={{ marginLeft: 20 }}>
          Pan Shop:&nbsp;
          <select value={selectedPanShop} onChange={e => setSelectedPanShop(e.target.value)}>
            <option value="">Select Pan Shop</option>
            {panShops.map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        </label>
      )}
      
      {transactionType === "wholesaler" && (
        <>
          <label style={{ marginLeft: 20 }}>
            <input
              type="checkbox"
              checked={autoCreateWholesaler}
              onChange={e => setAutoCreateWholesaler(e.target.checked)}
            />
            &nbsp;Auto-create wholesaler if mark not found
          </label>
          
          <button 
            onClick={() => setShowWholesalers(!showWholesalers)}
            style={{ 
              marginLeft: "20px",
              padding: "5px 10px", 
              backgroundColor: "#6c757d", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {showWholesalers ? "Hide Wholesalers List" : "Show Wholesalers List"}
          </button>
          
          {showWholesalers && (
            <div style={{ 
              marginTop: "15px", 
              padding: "10px", 
              border: "1px solid #ddd", 
              borderRadius: "4px", 
              maxHeight: "200px", 
              overflowY: "auto"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h5 style={{ margin: 0 }}>Available Wholesalers:</h5>
                <button 
                  onClick={fetchWholesalers} 
                  disabled={refreshingWholesalers}
                  style={{ 
                    padding: "5px 10px", 
                    backgroundColor: "#28a745", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px",
                    cursor: refreshingWholesalers ? "default" : "pointer"
                  }}
                >
                  {refreshingWholesalers ? "Refreshing..." : "Refresh List"}
                </button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f2f2f2" }}>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Name</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {wholesalers.map(w => (
                    <tr key={w.id}>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{w.name}</td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{w.mark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {wholesalers.length === 0 && <p>No wholesalers found.</p>}
            </div>
          )}
        </>
      )}
      
      <br /><br />
      
      {ocrText && (
        <div style={{ marginBottom: "20px" }}>
          <button 
            onClick={() => setShowRawText(!showRawText)}
            style={{ 
              padding: "5px 10px", 
              backgroundColor: "#6c757d", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "10px"
            }}
          >
            {showRawText ? "Hide Raw OCR Text" : "Show Raw OCR Text"}
          </button>
          
          {showRawText && (
            <div style={{ 
              border: "1px solid #ddd", 
              borderRadius: "4px", 
              padding: "10px", 
              backgroundColor: "#f8f9fa",
              whiteSpace: "pre-wrap",
              maxHeight: "200px",
              overflowY: "auto"
            }}>
              <h5>Raw OCR Text:</h5>
              <pre>{ocrText}</pre>
            </div>
          )}
        </div>
      )}
      
      {parsedRows.length > 0 && (
        <>
          <h4>Preview & Edit Data Before Saving:</h4>
          {errorMessage && <div style={{ color: "red", marginBottom: "10px", padding: "10px", backgroundColor: "#ffebee", borderRadius: "5px" }}>{errorMessage}</div>}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f2f2f2" }}>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Amount</th>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Mark</th>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Extra</th>
                  <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9f9f9" }}>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      <input
                        value={row.amount}
                        onChange={e => handleRowChange(idx, "amount", e.target.value)}
                        style={{ 
                          width: "80px", 
                          padding: "5px",
                          border: validationErrors[idx]?.amount ? "1px solid #f44336" : "1px solid #ced4da" 
                        }}
                      />
                      {validationErrors[idx]?.amount && (
                        <div style={{ color: "#f44336", fontSize: "12px" }}>{validationErrors[idx].amount}</div>
                      )}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      <input
                        value={row.mark}
                        onChange={e => handleRowChange(idx, "mark", e.target.value)}
                        style={{ 
                          width: "80px", 
                          padding: "5px",
                          border: validationErrors[idx]?.mark ? "1px solid #f44336" : "1px solid #ced4da" 
                        }}
                      />
                      {validationErrors[idx]?.mark && (
                        <div style={{ color: "#f44336", fontSize: "12px" }}>{validationErrors[idx].mark}</div>
                      )}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      <input
                        value={row.date}
                        onChange={e => handleRowChange(idx, "date", e.target.value)}
                        style={{ 
                          width: "120px", 
                          padding: "5px",
                          border: validationErrors[idx]?.date ? "1px solid #f44336" : "1px solid #ced4da" 
                        }}
                        placeholder="DD-MM-YYYY"
                      />
                      {validationErrors[idx]?.date && (
                        <div style={{ color: "#f44336", fontSize: "12px" }}>{validationErrors[idx].date}</div>
                      )}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      <input
                        value={row.extra}
                        onChange={e => handleRowChange(idx, "extra", e.target.value)}
                        style={{ width: "120px", padding: "5px" }}
                      />
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      <button 
                        onClick={() => removeRow(idx)} 
                        style={{ 
                          marginRight: "5px", 
                          padding: "5px 10px", 
                          backgroundColor: "#f44336", 
                          color: "white", 
                          border: "none", 
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={addEmptyRow} 
            style={{ 
              marginRight: "10px", 
              padding: "8px 16px", 
              backgroundColor: "#2196F3", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Add Row
          </button>
          <button 
            onClick={handleSave} 
            disabled={saveLoading}
            style={{ 
              padding: "8px 16px", 
              backgroundColor: saveLoading ? "#cccccc" : "#4CAF50", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: saveLoading ? "default" : "pointer"
            }}
          >
            {saveLoading ? "Saving..." : "Save to Database"}
          </button>
        </>
      )}
    </div>
  );
}

export default OCRUpload;