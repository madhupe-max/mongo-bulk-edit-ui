import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

export default function App() {
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState({});
  const [editFields, setEditFields] = useState([]);
  const [error, setError] = useState('');

  // Load records on mount
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/records');
      setRecords(response.data);
    } catch (err) {
      setError('Failed to load records: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Toggle row selection
  const toggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  // Toggle all selections
  const toggleSelectAll = () => {
    if (selected.size === records.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(records.map(r => r._id)));
    }
  };

  // Get editable fields from first record
  useEffect(() => {
    if (records.length > 0) {
      const fields = Object.keys(records[0]).filter(k => k !== '_id');
      setEditFields(fields);
    }
  }, [records]);

  // Apply bulk updates
  const applyBulkEdit = async () => {
    if (selected.size === 0 || Object.keys(bulkUpdates).length === 0) {
      setError('Select records and enter update values');
      return;
    }

    try {
      setError('');
      const response = await axios.post('/api/records/bulk/update', {
        ids: Array.from(selected),
        updates: bulkUpdates
      });

      if (response.data.success) {
        // Refetch records to show updates
        await fetchRecords();
        setSelected(new Set());
        setBulkEditMode(false);
        setBulkUpdates({});
      }
    } catch (err) {
      setError('Bulk edit failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle bulk field change
  const handleBulkFieldChange = (field, value) => {
    setBulkUpdates(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) return <div className="container"><p>Loading records...</p></div>;

  return (
    <div className="container">
      <h1>MongoDB Records - Bulk Edit</h1>

      {error && <div className="error">{error}</div>}

      <div className="toolbar">
        <button onClick={fetchRecords} className="btn-primary">
          ↻ Refresh
        </button>
        <span className="status">
          {selected.size > 0 && `${selected.size} selected`}
        </span>
        {selected.size > 0 && (
          <button
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className="btn-warning"
          >
            {bulkEditMode ? 'Cancel Bulk Edit' : 'Bulk Edit'}
          </button>
        )}
      </div>

      {bulkEditMode && selected.size > 0 && (
        <div className="bulk-edit-panel">
          <h3>Update {selected.size} selected records</h3>
          <div className="bulk-edit-fields">
            {editFields.map(field => (
              <div key={field} className="field-group">
                <label>{field}:</label>
                <input
                  type="text"
                  placeholder={`New ${field}`}
                  value={bulkUpdates[field] || ''}
                  onChange={e => handleBulkFieldChange(field, e.target.value)}
                />
              </div>
            ))}
          </div>
          <button onClick={applyBulkEdit} className="btn-success">
            Apply Updates
          </button>
          <button onClick={() => setBulkEditMode(false)} className="btn-secondary">
            Cancel
          </button>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selected.size === records.length && records.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>ID</th>
              {editFields.map(field => (
                <th key={field}>{field}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={editFields.length + 2} className="empty">
                  No records found. Add some to MongoDB to get started.
                </td>
              </tr>
            ) : (
              records.map(record => (
                <tr key={record._id} className={selected.has(record._id) ? 'selected' : ''}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selected.has(record._id)}
                      onChange={() => toggleSelect(record._id)}
                    />
                  </td>
                  <td className="id-col">{record._id.toString().slice(0, 12)}...</td>
                  {editFields.map(field => (
                    <td key={field}>{String(record[field] || '')}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
