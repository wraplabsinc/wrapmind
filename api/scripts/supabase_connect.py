import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables")

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

SAMPLE_CARS = [
    {
        "make": "Toyota",
        "model": "Camry",
        "year": 2023,
        "trim": "LE",
        "vehicle_type": "sedan",
        "vin": "1HGBH41JXMN109186",
        "length_mm": 4879,
        "width_mm": 1839,
        "height_mm": 1445,
        "wheelbase_mm": 2824,
        "ground_clearance_mm": 140,
        "curb_weight_kg": 1575,
        "gross_weight_kg": 2035,
        "body_parts": {
            "hood": {"length": 1450, "width": 1600, "material": "aluminum"},
            "front_fender_left": {"material": "steel"},
            "front_fender_right": {"material": "steel"},
            "rear_fender_left": {"material": "steel"},
            "rear_fender_right": {"material": "steel"},
            "door_left_front": {"material": "steel"},
            "door_right_front": {"material": "steel"},
            "door_left_rear": {"material": "steel"},
            "door_right_rear": {"material": "steel"}
        },
        "vendor_pricing": {
            "oem": {"hood": 850.00, "front_fender": 320.00},
            "aftermarket": {"hood": 425.00, "front_fender": 180.00}
        }
    },
    {
        "make": "Honda",
        "model": "Accord",
        "year": 2023,
        "trim": "Sport",
        "vehicle_type": "sedan",
        "vin": "1HGCV1F34NA123456",
        "length_mm": 4862,
        "width_mm": 1852,
        "height_mm": 1449,
        "wheelbase_mm": 2830,
        "ground_clearance_mm": 145,
        "curb_weight_kg": 1495,
        "gross_weight_kg": 1960,
        "body_parts": {
            "hood": {"length": 1420, "width": 1550, "material": "aluminum"},
            "front_fender_left": {"material": "steel"},
            "front_fender_right": {"material": "steel"}
        },
        "vendor_pricing": {
            "oem": {"hood": 780.00, "front_fender": 295.00},
            "aftermarket": {"hood": 390.00, "front_fender": 165.00}
        }
    }
]

def insert_sample_data():
    print("Connecting to Supabase...")
    print(f"Project URL: {SUPABASE_URL}")

    for car in SAMPLE_CARS:
        print(f"\nInserting: {car['year']} {car['make']} {car['model']}")
        data, count = supabase.table("cars").insert(car).execute()
        print(f"  Success! Inserted {len(data)} row(s)")

    print("\nFetching all cars to verify...")
    result = supabase.table("cars").select("*").execute()
    print(f"Total cars in database: {len(result.data)}")
    for car in result.data:
        print(f"  - {car['year']} {car['make']} {car['model']} (VIN: {car['vin']})")

if __name__ == "__main__":
    insert_sample_data()
