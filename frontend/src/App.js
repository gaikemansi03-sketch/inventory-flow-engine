import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import FileUpload from './components/FileUpload';
import { fetchInventoryData, deleteAllData } from './services/supabase';
import './App.css';

function App() {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadInventoryData = async () => {
    setLoading(true);
    const result = await fetchInventoryData();
    setLoading(false);

    if (result.success) {
      setInventoryData(result.data || []);
      if (result.data?.length === 0) {
        toast('📭 No inventory data found. Upload an Excel file to get started!', {
          icon: '📭',
          duration: 4000,
        });
      }
    } else {
      toast.error('Failed to load inventory data: ' + result.error);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const handleDeleteAll = async () => {
    const result = await deleteAllData();
    if (result.success) {
      toast.success('All inventory data deleted!');
      setShowDeleteConfirm(false);
      loadInventoryData();
    } else {
      toast.error('Failed to delete data: ' + result.error);
    }
  };

  const getRiskBadge = (isRisk) => {
    if (isRisk === true) {
      return <span className="badge risk-high">🔴 High Risk</span>;
    } else if (isRisk === false) {
      return <span className="badge risk-low">🟢 Low Risk</span>;
    }
    return <span className="badge risk-unknown">⚪ Unknown</span>;
  };

  const getActionBadge = (action) => {
    if (!action) return <span className="badge action-unknown">⏳ Pending</span>;
    
    if (action.includes('IMMEDIATE') || action.includes('CRITICAL')) {
      return <span className="badge action-critical">🚨 {action}</span>;
    } else if (action.includes('HIGH PRIORITY') || action.includes('Expedite')) {
      return <span className="badge action-high">🔴 {action}</span>;
    } else if (action.includes('CAUTION') || action.includes('Approaching')) {
      return <span className="badge action-caution">🟡 {action}</span>;
    } else if (action.includes('OPTIMIZE') || action.includes('Overstocked')) {
      return <span className="badge action-optimize">📦 {action}</span>;
    } else if (action.includes('healthy') || action.includes('HEALTHY')) {
      return <span className="badge action-healthy">✅ {action}</span>;
    }
    return <span className="badge action-unknown">ℹ️ {action}</span>;
  };

  // Calculate summary statistics
  const totalProducts = inventoryData.length;
  const lowStockItems = inventoryData.filter(item => 
    (item.current_inventory_count || 0) <= (item.safety_stock_level || 0)
  ).length;
  const totalInTransit = inventoryData.reduce((sum, item) => 
    sum + (item.in_transit_quantity || 0), 0
  );
  const productsAtRisk = inventoryData.filter(item => 
    item.is_stockout_risk === true
  ).length;

  return (
    <div className="App">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <header className="app-header">
        <h1>📦 Inventory Management System</h1>
        <p>Upload and manage your inventory data</p>
      </header>

      <main className="app-main">
        <FileUpload onUploadSuccess={loadInventoryData} />
        
        {/* KPIs Section - Always show if there's data */}
        {!loading && inventoryData.length > 0 && (
          <div className="inventory-summary">
            <div className="summary-card">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <h3>Total Products</h3>
                <p>{totalProducts}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📈</div>
              <div className="summary-content">
                <h3>Low Stock Items</h3>
                <p>{lowStockItems}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🚚</div>
              <div className="summary-content">
                <h3>In Transit</h3>
                <p>{totalInTransit}</p>
              </div>
            </div>
            <div className="summary-card risk-summary">
              <div className="summary-icon">⚠️</div>
              <div className="summary-content">
                <h3>Products at Risk</h3>
                <p className="risk-count">{productsAtRisk}</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Table Section - Show when there's data */}
        {!loading && inventoryData.length > 0 && (
          <div className="data-table-container">
            <div className="table-header">
              <h2>📋 Inventory Details with Calculated Metrics</h2>
              <div className="table-legend">
                <span className="legend-item">
                  <span className="legend-color risk-high"></span> High Risk
                </span>
                <span className="legend-item">
                  <span className="legend-color risk-low"></span> Low Risk
                </span>
                <span className="legend-item">
                  <span className="legend-color critical"></span> Critical
                </span>
              </div>
            </div>
            
            <div className="table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Current Stock</th>
                    <th>Committed</th>
                    <th>Available</th>
                    <th>In Transit</th>
                    <th>Safety Stock</th>
                    <th>Lead Time (hrs)</th>
                    <th className="highlight-col">⏰ Runout (hrs)</th>
                    <th className="highlight-col">⚠️ Risk</th>
                    <th className="highlight-col">🎯 Action Required</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((item, index) => {
                    const availableStock = (item.current_inventory_count || 0) - (item.committed_stock_count || 0);
                    const isLowStock = availableStock <= (item.safety_stock_level || 0);
                    
                    return (
                      <tr key={index} className={item.is_stockout_risk ? 'risk-row' : ''}>
                        <td><strong>{item.product_id}</strong></td>
                        <td>{item.current_inventory_count || 0}</td>
                        <td>{item.committed_stock_count || 0}</td>
                        <td className={isLowStock ? 'low-stock' : ''}>
                          {availableStock}
                          {isLowStock && ' ⚠️'}
                        </td>
                        <td>{item.in_transit_quantity || 0}</td>
                        <td>{item.safety_stock_level || 0}</td>
                        <td>{item.supplier_lead_time_hours || 0}</td>
                        <td className="highlight-col">
                          {item.runout_time_hour ? `${item.runout_time_hour}h` : 'N/A'}
                        </td>
                        <td className="highlight-col">
                          {getRiskBadge(item.is_stockout_risk)}
                        </td>
                        <td className="highlight-col action-cell">
                          {getActionBadge(item.action_required)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="table-footer">
              <span>Showing {inventoryData.length} products</span>
              <div className="table-actions">
                <button 
                  className="refresh-btn"
                  onClick={loadInventoryData}
                >
                  🔄 Refresh
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  🗑️ Delete All Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && inventoryData.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Inventory Data</h3>
            <p>Upload an Excel or CSV file to get started with inventory management.</p>
            <p style={{fontSize: '14px', color: '#999', marginTop: '10px'}}>
              Supported formats: .xlsx, .xls, .csv
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading inventory data...</p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>⚠️ Confirm Delete</h3>
              <p>Are you sure you want to delete all inventory data? This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button className="modal-delete" onClick={handleDeleteAll}>
                  Yes, Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;