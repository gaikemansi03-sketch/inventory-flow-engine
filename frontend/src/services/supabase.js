const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const uploadInventoryData = async (data) => {
  try {
    console.log('📤 Uploading data to backend...');
    
    // Upload to main table
    const uploadResponse = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.error || 'Upload failed');
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadResult);

    // Process inventory metrics
    console.log('🔄 Processing inventory metrics...');
    const processResponse = await fetch(`${API_URL}/process-inventory`, {
      method: 'POST',
    });

    if (!processResponse.ok) {
      const error = await processResponse.json();
      throw new Error(error.error || 'Processing failed');
    }

    const processResult = await processResponse.json();
    console.log('✅ Processing complete:', processResult);

    return { success: true, data: processResult };
  } catch (error) {
    console.error('❌ Upload error:', error);
    return { success: false, error: error.message };
  }
};

export const fetchInventoryData = async () => {
  try {
    console.log('📥 Fetching inventory data from backend...');
    
    const response = await fetch(`${API_URL}/inventory`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch data');
    }

    const result = await response.json();
    console.log(`✅ Fetched ${result.data?.length || 0} records`);
    
    return { success: true, data: result.data || [] };
  } catch (error) {
    console.error('❌ Fetch error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const deleteAllData = async () => {
  try {
    console.log('🧹 Deleting all inventory data...');
    
    const response = await fetch(`${API_URL}/delete-all`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }

    const result = await response.json();
    console.log('✅ Delete complete:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Delete error:', error);
    return { success: false, error: error.message };
  }
};

export const supabase = null;