#!/usr/bin/env python3
"""
Tamil Nadu Admin Generator Script

This script processes the Tamil Nadu pincodes CSV file and:
1. Filters Tamil Nadu cities/towns
2. Generates admin credentials for each unique city
3. Inserts admin records into MongoDB
4. Optionally exports credentials to Excel/CSV

Requirements: pip install pymongo pandas openpyxl bcrypt
"""

import csv
import os
import random
import string
import pandas as pd
from datetime import datetime
from collections import defaultdict
import bcrypt
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
CSV_FILE_PATH = "tamil_nadu_pincodes.csv"
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DB_NAME = 'fixitfast'
COLLECTION_NAME = 'admins'
SUPER_ADMIN_PASSWORD = "SuperAdmin@123"  # Default password for all admins

# Export options
EXPORT_TO_CSV = True
EXPORT_TO_EXCEL = True
OUTPUT_CSV_FILE = f"tamil_nadu_admins_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
OUTPUT_EXCEL_FILE = f"tamil_nadu_admins_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

def generate_password(length=12):
    """Generate a random password with specified length"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(characters) for _ in range(length))

def generate_username(city_name, district_name):
    """Generate a username based on city and district"""
    # Clean and format the city name
    city_clean = city_name.replace(' ', '').replace('-', '').lower()
    district_clean = district_name.replace(' ', '').replace('-', '').lower()
    
    # Create username: city_district_admin
    username = f"{city_clean}_{district_clean}_admin"
    return username

def hash_password(password):
    """Hash password using bcrypt (compatible with Node.js bcryptjs)"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def read_and_filter_csv():
    """Read CSV file and filter Tamil Nadu entries"""
    print("📖 Reading and filtering CSV data...")
    
    tamil_nadu_data = []
    unique_cities = set()
    
    try:
        with open(CSV_FILE_PATH, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                if row['statename'].strip().upper() == 'TAMIL NADU':
                    city_district_key = (row['Taluk'].strip(), row['Districtname'].strip())
                    
                    if city_district_key not in unique_cities:
                        unique_cities.add(city_district_key)
                        tamil_nadu_data.append({
                            'pincode': row['pincode'].strip(),
                            'city': row['Taluk'].strip(),
                            'district': row['Districtname'].strip(),
                            'state': row['statename'].strip()
                        })
        
        print(f"✅ Found {len(tamil_nadu_data)} unique cities/towns in Tamil Nadu")
        return tamil_nadu_data
        
    except FileNotFoundError:
        print(f"❌ Error: CSV file '{CSV_FILE_PATH}' not found!")
        return []
    except Exception as e:
        print(f"❌ Error reading CSV: {str(e)}")
        return []

def generate_admin_credentials(cities_data):
    """Generate admin credentials for each city"""
    print("🔐 Generating admin credentials...")
    
    admin_records = []
    
    for city_data in cities_data:
        city = city_data['city']
        district = city_data['district']
        
        # Skip if city name is N/A or empty
        if not city or city.upper() in ['N/A', 'NA', '']:
            continue
            
        username = generate_username(city, district)
        email = f"{username}@fixitfast.gov.in"
        
        # Use the provided super admin password
        password = SUPER_ADMIN_PASSWORD
        hashed_password = hash_password(password)
        
        admin_record = {
            'name': f"{city} Admin",
            'email': email,
            'password': hashed_password,
            'phone': '',
            'profilePicture': '',
            'role': 'admin',
            'status': 'active',
            'lastLogin': None,
            'emailVerified': False,
            'permissions': [
                'view_complaints',
                'update_complaints',
                'assign_labour',
                'view_reports',
                'manage_users'
            ],
            'adminSecretKey': None,
            'city': city,
            'district': district,
            'state': 'Tamil Nadu',
            'pincode': city_data['pincode'],
            'username': username,
            'plain_password': password,  # For export only, will be removed before DB insert
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        admin_records.append(admin_record)
    
    print(f"✅ Generated credentials for {len(admin_records)} admins")
    return admin_records

def connect_to_mongodb():
    """Connect to MongoDB database"""
    try:
        print("🔌 Connecting to MongoDB...")
        client = MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        
        # Test connection
        client.server_info()
        print(f"✅ Connected to MongoDB: {DB_NAME}")
        return db
        
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {str(e)}")
        return None

def insert_admins_to_db(db, admin_records):
    """Insert admin records into MongoDB"""
    print("💾 Inserting admin records into database...")
    
    if db is None:
        print("❌ Database connection not available")
        return 0
    
    collection = db[COLLECTION_NAME]
    inserted_count = 0
    duplicate_count = 0
    error_count = 0
    
    for admin in admin_records:
        try:
            # Remove plain_password before inserting to DB
            db_admin = admin.copy()
            db_admin.pop('plain_password', None)
            
            # Insert the admin
            collection.insert_one(db_admin)
            inserted_count += 1
            print(f"✅ Inserted admin for {admin['city']}")
            
        except DuplicateKeyError:
            duplicate_count += 1
            print(f"⚠️  Admin for {admin['city']} already exists (duplicate email)")
            
        except Exception as e:
            error_count += 1
            print(f"❌ Error inserting admin for {admin['city']}: {str(e)}")
    
    print(f"📊 Database insertion summary:")
    print(f"   ✅ Inserted: {inserted_count}")
    print(f"   ⚠️  Duplicates: {duplicate_count}")
    print(f"   ❌ Errors: {error_count}")
    
    return inserted_count

def export_to_csv(admin_records, filename):
    """Export admin credentials to CSV file"""
    try:
        print(f"📄 Exporting to CSV: {filename}")
        
        # Prepare data for CSV export
        export_data = []
        for admin in admin_records:
            export_data.append({
                'City': admin['city'],
                'District': admin['district'],
                'Username': admin['username'],
                'Email': admin['email'],
                'Password': admin['plain_password'],
                'Role': admin['role'],
                'Status': admin['status'],
                'Pincode': admin['pincode'],
                'Created': admin['createdAt'].strftime('%Y-%m-%d %H:%M:%S')
            })
        
        # Write to CSV
        df = pd.DataFrame(export_data)
        df.to_csv(filename, index=False)
        print(f"✅ CSV export completed: {filename}")
        
    except Exception as e:
        print(f"❌ Error exporting to CSV: {str(e)}")

def export_to_excel(admin_records, filename):
    """Export admin credentials to Excel file"""
    try:
        print(f"📊 Exporting to Excel: {filename}")
        
        # Prepare data for Excel export
        export_data = []
        for admin in admin_records:
            export_data.append({
                'City': admin['city'],
                'District': admin['district'],
                'Admin Name': admin['name'],
                'Username': admin['username'],
                'Email': admin['email'],
                'Password': admin['plain_password'],
                'Role': admin['role'],
                'Status': admin['status'],
                'Pincode': admin['pincode'],
                'State': admin['state'],
                'Created Date': admin['createdAt'].strftime('%Y-%m-%d'),
                'Created Time': admin['createdAt'].strftime('%H:%M:%S')
            })
        
        # Create Excel file with formatting
        df = pd.DataFrame(export_data)
        
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Tamil Nadu Admins', index=False)
            
            # Get the workbook and worksheet
            workbook = writer.book
            worksheet = writer.sheets['Tamil Nadu Admins']
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        print(f"✅ Excel export completed: {filename}")
        
    except Exception as e:
        print(f"❌ Error exporting to Excel: {str(e)}")

def main():
    """Main execution function"""
    print("🚀 Starting Tamil Nadu Admin Generator Script")
    print("=" * 60)
    
    # Step 1: Read and filter CSV data
    cities_data = read_and_filter_csv()
    if not cities_data:
        print("❌ No data to process. Exiting.")
        return
    
    # Step 2: Generate admin credentials
    admin_records = generate_admin_credentials(cities_data)
    if not admin_records:
        print("❌ No admin records generated. Exiting.")
        return
    
    # Step 3: Connect to MongoDB and insert data
    db = connect_to_mongodb()
    if db is not None:
        inserted_count = insert_admins_to_db(db, admin_records)
    else:
        inserted_count = 0
        print("⚠️  Skipping database insertion due to connection issues")
    
    # Step 4: Export to CSV (optional)
    if EXPORT_TO_CSV:
        export_to_csv(admin_records, OUTPUT_CSV_FILE)
    
    # Step 5: Export to Excel (optional)
    if EXPORT_TO_EXCEL:
        export_to_excel(admin_records, OUTPUT_EXCEL_FILE)
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 EXECUTION SUMMARY")
    print("=" * 60)
    print(f"🏙️  Total cities processed: {len(admin_records)}")
    print(f"💾 Records inserted to DB: {inserted_count}")
    if EXPORT_TO_CSV:
        print(f"📄 CSV export: {OUTPUT_CSV_FILE}")
    if EXPORT_TO_EXCEL:
        print(f"📊 Excel export: {OUTPUT_EXCEL_FILE}")
    print(f"🔐 Default password for all admins: {SUPER_ADMIN_PASSWORD}")
    print("=" * 60)
    print("✨ Script execution completed!")

if __name__ == "__main__":
    main()