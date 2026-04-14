const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nbewyeoiizlsfmbqoist.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_jQHCvoVBeWqMuc_P40HOJg_KggDk9dh';

const EPA_TO_WRAPOS_TYPE = {
    "Two-Seaters": "coupe",
    "Minicompact Cars": "coupe",
    "Subcompact Cars": "hatchback",
    "Compact Cars": "sedan",
    "Mid-Size Cars": "sedan",
    "Large Cars": "sedan",
    "Small Station Wagons": "wagon",
    "Mid-Size Cars Station Wagons": "wagon",
    "Large Cars Station Wagons": "wagon",
    "Small Pickup Trucks": "truck",
    "Standard Pickup Trucks": "truck",
    "Passenger Vans": "van",
    "Cargo Vans": "van",
    "Minivans": "van",
    "Sport Utility Vehicles (SUVs)": "suv",
    "Small Sport Utility Vehicles (SUVs)": "suv",
    "Standard Sport Utility Vehicles (SUVs)": "suv",
    "Special Purpose Vehicles": "suv",
};

function mapVehicleType(vclass) {
    return vclass ? EPA_TO_WRAPOS_TYPE[vclass] || null : null;
}

function parseCSV(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let values = [];
        let current = '';
        let inQuotes = false;

        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const record = {};
        headers.forEach((h, idx) => {
            record[h] = values[idx] || '';
        });
        records.push(record);
    }
    return records;
}

async function insertBatch(batch) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/cars`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(batch)
    });
    return response.ok;
}

async function main() {
    const yearStart = parseInt(process.argv[2]) || 2006;
    console.log(`Filtering vehicles from ${yearStart}+...`);

    const content = fs.readFileSync('vehicles.csv', 'utf8');
    const records = parseCSV(content);
    console.log(`Total EPA records: ${records.length}`);

    const filtered = records.filter(r => parseInt(r.year) >= yearStart);
    console.log(`Records from ${yearStart}+: ${filtered.length}`);

    const toInsert = filtered.map(r => ({
        year: parseInt(r.year),
        make: r.make,
        model: r.model,
        trim: r.trany || 'Base',
        vehicle_type: mapVehicleType(r.VClass),
        length_mm: null,
        width_mm: null,
        height_mm: null,
        wheelbase_mm: null,
        ground_clearance_mm: null,
        curb_weight_kg: null,
        gross_weight_kg: null,
        metadata: {
            epa_id: r.id,
            cylinders: r.cylinders || null,
            displacement_l: r.displ || null,
            fuel_type: r.fuelType || null,
            mpg_city: r.city08 || null,
            mpg_highway: r.highway08 || null,
            mpg_combined: r.comb08 || null,
            drive: r.drive || null,
            vclass: r.VClass || null,
        }
    }));

    console.log(`Inserting ${toInsert.length} records...`);
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const success = await insertBatch(batch);
        if (success) {
            inserted += batch.length;
            console.log(`Progress: ${inserted}/${toInsert.length}`);
        } else {
            console.log(`Error at batch ${i/batchSize + 1}, continuing...`);
        }
    }

    console.log(`\nDone! Inserted ${inserted} records`);
}

main().catch(console.error);
