"""
Comprehensive endpoint testing script
Tests all API endpoints with database integration

Requirements:
    pip install aiohttp
"""
import asyncio
import json
from datetime import datetime, timedelta

try:
    import aiohttp
except ImportError:
    print("❌ aiohttp not installed. Install with: pip install aiohttp")
    exit(1)

# Configuration
BASE_URL = "http://localhost:8000"
API_KEY = "micropaper-dev-api-key-2024"  # Must match .env file

# Test data
TEST_WALLET = "0x1234567890123456789012345678901234567890"
TEST_WALLET_2 = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"


async def make_request(method, url, headers=None, data=None):
    """Make HTTP request"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.request(method, url, headers=headers, json=data) as response:
                result = {
                    "status": response.status,
                    "data": await response.json() if response.content_type == "application/json" else await response.text()
                }
                return result
        except Exception as e:
            return {"error": str(e)}


async def test_health_endpoints():
    """Test health check endpoints"""
    print("\n" + "="*60)
    print("TESTING HEALTH ENDPOINTS")
    print("="*60)
    
    # Global health
    result = await make_request("GET", f"{BASE_URL}/health")
    print(f"\n✅ GET /health")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    # Compliance health
    result = await make_request("GET", f"{BASE_URL}/api/mock/compliance/health")
    print(f"\n✅ GET /api/mock/compliance/health")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    # Custodian health
    result = await make_request("GET", f"{BASE_URL}/api/mock/custodian/health")
    print(f"\n✅ GET /api/mock/custodian/health")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")


async def test_compliance_endpoints():
    """Test compliance endpoints"""
    print("\n" + "="*60)
    print("TESTING COMPLIANCE ENDPOINTS")
    print("="*60)
    
    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    
    # Check status (unverified wallet)
    result = await make_request("GET", f"{BASE_URL}/api/mock/compliance/{TEST_WALLET}", headers=headers)
    print(f"\n✅ GET /api/mock/compliance/{TEST_WALLET}")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    # Verify wallet
    result = await make_request("POST", f"{BASE_URL}/api/mock/compliance/verify/{TEST_WALLET}", headers=headers)
    print(f"\n✅ POST /api/mock/compliance/verify/{TEST_WALLET}")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    # Check status again (should be verified now)
    result = await make_request("GET", f"{BASE_URL}/api/mock/compliance/{TEST_WALLET}", headers=headers)
    print(f"\n✅ GET /api/mock/compliance/{TEST_WALLET} (after verification)")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    # Get stats
    result = await make_request("GET", f"{BASE_URL}/api/mock/compliance/stats", headers=headers)
    print(f"\n✅ GET /api/mock/compliance/stats")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    # Get verified wallets
    result = await make_request("GET", f"{BASE_URL}/api/mock/compliance/verified", headers=headers)
    print(f"\n✅ GET /api/mock/compliance/verified")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    # Unverify wallet
    result = await make_request("POST", f"{BASE_URL}/api/mock/compliance/unverify/{TEST_WALLET}", headers=headers)
    print(f"\n✅ POST /api/mock/compliance/unverify/{TEST_WALLET}")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")


async def test_custodian_endpoints():
    """Test custodian endpoints"""
    print("\n" + "="*60)
    print("TESTING CUSTODIAN ENDPOINTS")
    print("="*60)
    
    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    
    # Issue note
    maturity_date = (datetime.utcnow() + timedelta(days=90)).isoformat() + "Z"
    note_data = {
        "walletAddress": TEST_WALLET,
        "amount": 10000,
        "maturityDate": maturity_date
    }
    result = await make_request("POST", f"{BASE_URL}/api/mock/custodian/issue", headers=headers, data=note_data)
    print(f"\n✅ POST /api/mock/custodian/issue")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    issued_isin = result.get('data', {}).get('isin') if result.get('status') == 200 else None
    
    # Issue another note
    note_data_2 = {
        "walletAddress": TEST_WALLET_2,
        "amount": 5000,
        "maturityDate": maturity_date
    }
    result = await make_request("POST", f"{BASE_URL}/api/mock/custodian/issue", headers=headers, data=note_data_2)
    print(f"\n✅ POST /api/mock/custodian/issue (second note)")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    # Get all notes
    result = await make_request("GET", f"{BASE_URL}/api/mock/custodian/notes", headers=headers)
    print(f"\n✅ GET /api/mock/custodian/notes")
    print(f"   Status: {result.get('status')}")
    if result.get('status') == 200:
        notes = result.get('data', [])
        print(f"   Found {len(notes)} notes")
        if notes:
            print(f"   First note: {json.dumps(notes[0], indent=2)}")
    
    # Get notes by wallet
    result = await make_request("GET", f"{BASE_URL}/api/mock/custodian/notes?wallet_address={TEST_WALLET}", headers=headers)
    print(f"\n✅ GET /api/mock/custodian/notes?wallet_address={TEST_WALLET}")
    print(f"   Status: {result.get('status')}")
    if result.get('status') == 200:
        notes = result.get('data', [])
        print(f"   Found {len(notes)} notes for wallet {TEST_WALLET}")


async def test_error_handling():
    """Test error handling"""
    print("\n" + "="*60)
    print("TESTING ERROR HANDLING")
    print("="*60)
    
    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    
    # Invalid wallet address
    result = await make_request("GET", f"{BASE_URL}/api/mock/compliance/invalid_wallet", headers=headers)
    print(f"\n✅ GET /api/mock/compliance/invalid_wallet (should fail)")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    # Missing API key
    result = await make_request("GET", f"{BASE_URL}/api/mock/compliance/{TEST_WALLET}")
    print(f"\n✅ GET /api/mock/compliance/{TEST_WALLET} (no API key - should fail)")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")
    
    # Invalid note data
    invalid_note = {
        "walletAddress": "invalid",
        "amount": -100,
        "maturityDate": "invalid-date"
    }
    result = await make_request("POST", f"{BASE_URL}/api/mock/custodian/issue", headers=headers, data=invalid_note)
    print(f"\n✅ POST /api/mock/custodian/issue (invalid data - should fail)")
    print(f"   Status: {result.get('status')}")
    print(f"   Response: {json.dumps(result.get('data', {}), indent=2)}")


async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("MICROPAPER API ENDPOINT TEST SUITE")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"API Key: {API_KEY[:20]}...")
    print("\n⚠️  Make sure the server is running: uvicorn main:app --reload")
    
    try:
        await test_health_endpoints()
        await test_compliance_endpoints()
        await test_custodian_endpoints()
        await test_error_handling()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
