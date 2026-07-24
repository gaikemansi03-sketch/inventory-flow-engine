import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { uploadInventoryData } from '../services/supabase';
import './FileUpload.css';

const FileUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setFileInfo(file);
      readExcelFile(file);
    }
  }, []);

  const readExcelFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        const mappedData = jsonData.map(row => ({
          product_id: row.product_id || row.productId || '',
          current_inventory_count: parseInt(row.current_inventory_count || row.currentInventoryCount || 0),
          committed_stock_count: parseInt(row.committed_stock_count || row.committedStockCount || 0),
          in_transit_quantity: parseInt(row.in_transit_quantity || row.inTransitQuantity || 0),
          supplier_lead_time_hours: parseFloat(row.supplier_lead_time_hours || row.supplierLeadTimeHours || 0),
          safety_stock_level: parseInt(row.safety_stock_level || row.safetyStockLevel || 0),
        }));

        setPreviewData(mappedData);
        toast.success(`📊 Successfully read ${mappedData.length} rows from Excel file`);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast.error('❌ Error reading Excel file. Please check the format.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (previewData.length === 0) {
      toast.error('❌ No data to upload. Please select a valid Excel file.');
      return;
    }

    setUploading(true);
    const result = await uploadInventoryData(previewData);
    setUploading(false);

    if (result.success) {
      toast.success(`✅ Successfully uploaded ${previewData.length} records!`);
      setPreviewData([]);
      setFileInfo(null);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } else {
      toast.error(`❌ Upload failed: ${result.error}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
  });

  return (
    <div className="file-upload-container">
      <div className="upload-header">
        <h2>📤 Upload Inventory Data</h2>
        <p>Upload Excel or CSV file with inventory data</p>
      </div>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <div className="upload-icon">📁</div>
          {isDragActive ? (
            <p>Drop the file here...</p>
          ) : (
            <>
              <p>Drag & drop an Excel or CSV file here, or click to select</p>
              <small>Supported formats: .xlsx, .xls, .csv</small>
            </>
          )}
        </div>
      </div>

      {fileInfo && (
        <div className="file-info">
          <div className="file-details">
            <span className="file-name">📄 {fileInfo.name}</span>
            <span className="file-size">
              {(fileInfo.size / 1024).toFixed(2)} KB
            </span>
          </div>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="preview-section">
          <h3>Preview Data ({previewData.length} rows)</h3>
          <div className="table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Current Inventory</th>
                  <th>Committed Stock</th>
                  <th>In Transit</th>
                  <th>Lead Time (hrs)</th>
                  <th>Safety Stock</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td>{row.product_id}</td>
                    <td>{row.current_inventory_count}</td>
                    <td>{row.committed_stock_count}</td>
                    <td>{row.in_transit_quantity}</td>
                    <td>{row.supplier_lead_time_hours}</td>
                    <td>{row.safety_stock_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 5 && (
              <div className="more-rows">
                And {previewData.length - 5} more rows...
              </div>
            )}
          </div>

          <button
            className="upload-button"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="spinner"></span>
                Uploading...
              </>
            ) : (
              '📤 Upload to Database'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;