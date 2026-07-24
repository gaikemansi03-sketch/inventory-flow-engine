import os
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# Try different import methods
try:
    from supabase import create_client, Client
    print("✅ Using supabase package")
except ImportError:
    try:
        from supabase_py import create_client, Client
        print("✅ Using supabase_py package")
    except ImportError:
        print("❌ Please install supabase: pip3 install supabase")
        exit(1)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://vlqmtiswckyttexwgmjj.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscW10aXN3Y2t5dHRleHdnbWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MTc3MTUsImV4cCI6MjEwMDM5MzcxNX0.VzdMcEhiDNBMh9ra_8OLCIB1xvHjOk57qo5Ab0u_reo')
TABLE_NAME = os.getenv('TABLE_NAME', 'inventory')

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"✅ Connected to Supabase at: {SUPABASE_URL}")
except Exception as e:
    print(f"❌ Failed to connect to Supabase: {e}")
    supabase = None

# DEFAULT DAILY DEMAND
DEFAULT_DAILY_DEMAND = 10

def safe_int(value, default=0):
    """Safely convert to int, return default if None or invalid"""
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    """Safely convert to float, return default if None or invalid"""
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def calculate_inventory_metrics(row):
    """
    Calculate 3 key metrics for inventory management
    """
    try:
        # Safely get values with defaults
        product_id = row.get('product_id', 'Unknown')
        current_inventory = safe_int(row.get('current_inventory_count'))
        committed_stock = safe_int(row.get('committed_stock_count'))
        in_transit = safe_int(row.get('in_transit_quantity'))
        supplier_lead_time = safe_float(row.get('supplier_lead_time_hours'))
        safety_stock = safe_int(row.get('safety_stock_level'))
        
        # Calculate available stock
        available_stock = current_inventory - committed_stock
        
        # 1. CALCULATE RUNOUT TIME
        if DEFAULT_DAILY_DEMAND > 0 and available_stock > 0:
            hourly_demand = DEFAULT_DAILY_DEMAND / 24
            runout_time_hour = available_stock / hourly_demand
            runout_time_hour = round(runout_time_hour, 2)
        else:
            runout_time_hour = None
        
        # 2. CALCULATE STOCKOUT RISK
        is_stockout_risk = False
        if runout_time_hour is not None and supplier_lead_time > 0:
            if runout_time_hour <= supplier_lead_time:
                is_stockout_risk = True
        
        # 3. DETERMINE ACTION REQUIRED
        action_required = "✅ Stock level healthy - Monitor regularly"
        
        if available_stock <= 0:
            action_required = "🚨 IMMEDIATE ACTION: OUT OF STOCK! Reorder now!"
        elif available_stock <= safety_stock:
            action_required = "🔴 CRITICAL: Reorder Immediately - Below Safety Stock"
        elif is_stockout_risk:
            action_required = "🟠 HIGH PRIORITY: Expedite Order - Will run out before replenishment"
        elif available_stock <= safety_stock * 1.5:
            action_required = "🟡 CAUTION: Monitor Inventory - Approaching Safety Stock"
        elif available_stock > safety_stock * 3:
            action_required = "🟢 OPTIMIZE: Reduce Inventory - Overstocked"
        
        return {
            'runout_time_hour': runout_time_hour,
            'is_stockout_risk': is_stockout_risk,
            'action_required': action_required,
            'available_stock': available_stock,
            'daily_demand_used': DEFAULT_DAILY_DEMAND,
            'in_transit': in_transit,
            'total_available_with_in_transit': available_stock + in_transit
        }
    except Exception as e:
        print(f"❌ Error calculating metrics: {e}")
        return {
            'runout_time_hour': None,
            'is_stockout_risk': False,
            'action_required': '⚠️ Error in calculation',
            'available_stock': 0,
            'daily_demand_used': DEFAULT_DAILY_DEMAND,
            'in_transit': 0,
            'total_available_with_in_transit': 0
        }

@app.route('/')
def home():
    return jsonify({
        'status': 'running',
        'message': 'Inventory Management API',
        'supabase_connected': supabase is not None
    })

@app.route('/upload', methods=['POST'])
def upload_data():
    """Upload inventory data to Supabase"""
    try:
        if not supabase:
            return jsonify({
                'success': False,
                'error': 'Supabase not connected'
            }), 500
            
        data = request.json
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Clean the data before inserting
        cleaned_data = []
        for row in data:
            cleaned_row = {
                'product_id': str(row.get('product_id', '')).strip(),
                'current_inventory_count': safe_int(row.get('current_inventory_count')),
                'committed_stock_count': safe_int(row.get('committed_stock_count')),
                'in_transit_quantity': safe_int(row.get('in_transit_quantity')),
                'supplier_lead_time_hours': safe_float(row.get('supplier_lead_time_hours')),
                'safety_stock_level': safe_int(row.get('safety_stock_level'))
            }
            # Only add if product_id is not empty
            if cleaned_row['product_id']:
                cleaned_data.append(cleaned_row)
        
        if not cleaned_data:
            return jsonify({
                'success': False,
                'error': 'No valid data to upload'
            }), 400
        
        # Insert data
        response = supabase.table(TABLE_NAME).insert(cleaned_data).execute()
        
        print(f"📥 Uploaded {len(cleaned_data)} records")
        
        return jsonify({
            'success': True,
            'message': f'Successfully uploaded {len(cleaned_data)} records',
            'data': response.data
        })
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/process-inventory', methods=['POST'])
def process_inventory():
    """Process inventory and calculate metrics"""
    try:
        if not supabase:
            return jsonify({
                'success': False,
                'error': 'Supabase not connected'
            }), 500
            
        print("🚀 Starting inventory calculation...")
        
        # Fetch data
        response = supabase.table(TABLE_NAME).select('*').execute()
        inventory_data = response.data
        
        if not inventory_data:
            return jsonify({
                'success': False,
                'message': 'No inventory data found'
            }), 404
        
        print(f"📦 Processing {len(inventory_data)} products...")
        
        success_count = 0
        error_count = 0
        processed_results = []
        
        for row in inventory_data:
            try:
                product_id = row.get('product_id', 'Unknown')
                
                # Calculate metrics
                metrics = calculate_inventory_metrics(row)
                
                # Update database
                update_response = supabase.table(TABLE_NAME).update({
                    'runout_time_hour': metrics['runout_time_hour'],
                    'is_stockout_risk': metrics['is_stockout_risk'],
                    'action_required': metrics['action_required'],
                    'avg_daily_demand': DEFAULT_DAILY_DEMAND,
                    'last_calculated_at': datetime.now().isoformat()
                }).eq('product_id', product_id).execute()
                
                success_count += 1
                processed_results.append({
                    'product_id': product_id,
                    'runout_time_hour': metrics['runout_time_hour'],
                    'is_stockout_risk': metrics['is_stockout_risk'],
                    'action_required': metrics['action_required']
                })
                
            except Exception as e:
                print(f"❌ Error processing {row.get('product_id', 'Unknown')}: {e}")
                error_count += 1
        
        return jsonify({
            'success': True,
            'message': 'Inventory processing completed',
            'total_products': len(inventory_data),
            'success_count': success_count,
            'error_count': error_count,
            'results': processed_results
        })
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/inventory', methods=['GET'])
def get_inventory():
    """Get all inventory data"""
    try:
        if not supabase:
            return jsonify({
                'success': False,
                'error': 'Supabase not connected'
            }), 500
            
        response = supabase.table(TABLE_NAME).select('*').execute()
        
        # Format data safely
        formatted_data = []
        for item in response.data:
            formatted_data.append({
                'product_id': item.get('product_id', ''),
                'current_inventory_count': safe_int(item.get('current_inventory_count')),
                'committed_stock_count': safe_int(item.get('committed_stock_count')),
                'in_transit_quantity': safe_int(item.get('in_transit_quantity')),
                'supplier_lead_time_hours': safe_float(item.get('supplier_lead_time_hours')),
                'safety_stock_level': safe_int(item.get('safety_stock_level')),
                'runout_time_hour': item.get('runout_time_hour'),
                'is_stockout_risk': item.get('is_stockout_risk', False),
                'action_required': item.get('action_required', 'Not calculated yet'),
                'last_calculated_at': item.get('last_calculated_at')
            })
        
        return jsonify({
            'success': True,
            'count': len(formatted_data),
            'data': formatted_data
        })
    except Exception as e:
        print(f"❌ Error in /inventory: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500

@app.route('/delete-all', methods=['POST'])
def delete_all():
    """Delete all data"""
    try:
        if not supabase:
            return jsonify({
                'success': False,
                'error': 'Supabase not connected'
            }), 500
        
        response = supabase.table(TABLE_NAME).delete().neq('product_id', 'none').execute()
        
        return jsonify({
            'success': True,
            'message': 'All inventory data deleted',
            'deleted_count': len(response.data) if response.data else 0
        })
        
    except Exception as e:
        print(f"❌ Delete error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 Starting Inventory Management API")
    print("="*50)
    print(f"📡 Supabase URL: {SUPABASE_URL}")
    print(f"📊 Table: {TABLE_NAME}")
    print(f"🔗 Connected: {supabase is not None}")
    print("📈 Daily Demand: 10 units/day")
    print("🌐 API running at: http://localhost:5001")
    print("="*50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5001)