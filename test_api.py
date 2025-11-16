#!/usr/bin/env python3
"""Test script for FastAPI backend"""

import requests
import json

API_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{API_URL}/health")
    print(f"✅ Health: {response.json()}")
    return response.status_code == 200

def test_add_partner():
    """Test adding a partner"""
    print("\n🔍 Testing add partner...")
    data = {
        "name": "علی احمدی",
        "capital": 10000000,
        "share": 50
    }
    response = requests.post(f"{API_URL}/api/partners", json=data)
    print(f"✅ Partner added: {response.json()}")
    return response.status_code == 200

def test_get_partners():
    """Test getting all partners"""
    print("\n🔍 Testing get partners...")
    response = requests.get(f"{API_URL}/api/partners")
    partners = response.json()
    print(f"✅ Partners count: {len(partners)}")
    for partner in partners:
        print(f"   - {partner['name']}: {partner['capital']:,} تومان")
    return response.status_code == 200

def main():
    """Run all tests"""
    print("🚀 Testing FastAPI Backend\n")
    print("=" * 50)
    
    try:
        # Test health
        if not test_health():
            print("❌ Health check failed!")
            return
        
        # Test add partner
        if not test_add_partner():
            print("❌ Add partner failed!")
            return
        
        # Test get partners
        if not test_get_partners():
            print("❌ Get partners failed!")
            return
        
        print("\n" + "=" * 50)
        print("✅ All tests passed!")
        print("\n📊 Database: backend/installment_business.db")
        print("📡 API: http://localhost:8000")
        print("📚 Docs: http://localhost:8000/docs")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend!")
        print("   Make sure backend is running: python main.py")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
