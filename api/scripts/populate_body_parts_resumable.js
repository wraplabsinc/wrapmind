const fs = require('fs');

const SUPABASE_URL = 'https://nbewyeoiizlsfmbqoist.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jQHCvoVBeWqMuc_P40HOJg_KggDk9dh';
const PROGRESS_FILE = '.body_parts_progress.json';

const DIMENSION_AVERAGES = {
    coupe: { length_mm: 4600, width_mm: 1850, height_mm: 1350 },
    sedan: { length_mm: 4800, width_mm: 1850, height_mm: 1450 },
    hatchback: { length_mm: 4200, width_mm: 1750, height_mm: 1500 },
    suv: { length_mm: 4800, width_mm: 1900, height_mm: 1750 },
    truck: { length_mm: 5300, width_mm: 2000, height_mm: 1950 },
    van: { length_mm: 5000, width_mm: 1950, height_mm: 1950 },
    wagon: { length_mm: 4800, width_mm: 1850, height_mm: 1550 }
};

const PART_RATIOS = {
    sedan: {
        hood: { length: 0.40, width: 0.85, height: 0.12 },
        front_fender_left: { length: 0.25, width: 0.18, height: 0.15 },
        front_fender_right: { length: 0.25, width: 0.18, height: 0.15 },
        rear_fender_left: { length: 0.22, width: 0.18, height: 0.15 },
        rear_fender_right: { length: 0.22, width: 0.18, height: 0.15 },
        door_left_front: { length: 0.30, width: 0.12, height: 0.45 },
        door_right_front: { length: 0.30, width: 0.12, height: 0.45 },
        door_left_rear: { length: 0.28, width: 0.12, height: 0.42 },
        door_right_rear: { length: 0.28, width: 0.12, height: 0.42 },
        trunk: { length: 0.25, width: 0.80, height: 0.15 },
        front_bumper: { length: 0.08, width: 0.90, height: 0.20 },
        rear_bumper: { length: 0.08, width: 0.90, height: 0.18 }
    },
    suv: {
        hood: { length: 0.42, width: 0.88, height: 0.14 },
        front_fender_left: { length: 0.28, width: 0.20, height: 0.18 },
        front_fender_right: { length: 0.28, width: 0.20, height: 0.18 },
        rear_fender_left: { length: 0.25, width: 0.20, height: 0.18 },
        rear_fender_right: { length: 0.25, width: 0.20, height: 0.18 },
        door_left_front: { length: 0.32, width: 0.14, height: 0.50 },
        door_right_front: { length: 0.32, width: 0.14, height: 0.50 },
        door_left_rear: { length: 0.30, width: 0.14, height: 0.48 },
        door_right_rear: { length: 0.30, width: 0.14, height: 0.48 },
        tailgate: { length: 0.35, width: 0.85, height: 0.50 },
        front_bumper: { length: 0.10, width: 0.92, height: 0.25 },
        rear_bumper: { length: 0.10, width: 0.92, height: 0.22 }
    },
    truck: {
        hood: { length: 0.45, width: 0.80, height: 0.20 },
        front_fender_left: { length: 0.30, width: 0.22, height: 0.25 },
        front_fender_right: { length: 0.30, width: 0.22, height: 0.25 },
        cab: { length: 0.50, width: 0.80, height: 0.60 },
        bed: { length: 0.60, width: 0.75, height: 0.25 },
        front_bumper: { length: 0.12, width: 0.85, height: 0.30 },
        rear_bumper: { length: 0.10, width: 0.85, height: 0.20 }
    },
    coupe: {
        hood: { length: 0.38, width: 0.82, height: 0.10 },
        front_fender_left: { length: 0.24, width: 0.18, height: 0.12 },
        front_fender_right: { length: 0.24, width: 0.18, height: 0.12 },
        rear_fender_left: { length: 0.22, width: 0.20, height: 0.12 },
        rear_fender_right: { length: 0.22, width: 0.20, height: 0.12 },
        door_left: { length: 0.28, width: 0.14, height: 0.40 },
        door_right: { length: 0.28, width: 0.14, height: 0.40 },
        trunk: { length: 0.20, width: 0.75, height: 0.12 },
        front_bumper: { length: 0.08, width: 0.85, height: 0.15 },
        rear_bumper: { length: 0.08, width: 0.85, height: 0.15 }
    },
    hatchback: {
        hood: { length: 0.36, width: 0.80, height: 0.12 },
        front_fender_left: { length: 0.22, width: 0.18, height: 0.14 },
        front_fender_right: { length: 0.22, width: 0.18, height: 0.14 },
        rear_fender_left: { length: 0.20, width: 0.18, height: 0.14 },
        rear_fender_right: { length: 0.20, width: 0.18, height: 0.14 },
        door_left_front: { length: 0.28, width: 0.13, height: 0.42 },
        door_right_front: { length: 0.28, width: 0.13, height: 0.42 },
        door_left_rear: { length: 0.25, width: 0.13, height: 0.38 },
        door_right_rear: { length: 0.25, width: 0.13, height: 0.38 },
        hatchbackdoor: { length: 0.35, width: 0.78, height: 0.45 },
        front_bumper: { length: 0.08, width: 0.88, height: 0.18 },
        rear_bumper: { length: 0.08, width: 0.88, height: 0.18 }
    },
    wagon: {
        hood: { length: 0.38, width: 0.82, height: 0.12 },
        front_fender_left: { length: 0.24, width: 0.18, height: 0.14 },
        front_fender_right: { length: 0.24, width: 0.18, height: 0.14 },
        rear_fender_left: { length: 0.22, width: 0.18, height: 0.14 },
        rear_fender_right: { length: 0.22, width: 0.18, height: 0.14 },
        door_left_front: { length: 0.28, width: 0.13, height: 0.44 },
        door_right_front: { length: 0.28, width: 0.13, height: 0.44 },
        door_left_rear: { length: 0.28, width: 0.13, height: 0.44 },
        door_right_rear: { length: 0.28, width: 0.13, height: 0.44 },
        rear_door: { length: 0.40, width: 0.80, height: 0.50 },
        front_bumper: { length: 0.08, width: 0.88, height: 0.18 },
        rear_bumper: { length: 0.08, width: 0.88, height: 0.18 }
    },
    van: {
        hood: { length: 0.40, width: 0.85, height: 0.18 },
        front_fender_left: { length: 0.28, width: 0.22, height: 0.20 },
        front_fender_right: { length: 0.28, width: 0.22, height: 0.20 },
        sliding_door_left: { length: 0.45, width: 0.12, height: 0.55 },
        sliding_door_right: { length: 0.45, width: 0.12, height: 0.55 },
        rear_doors: { length: 0.50, width: 0.85, height: 0.60 },
        front_bumper: { length: 0.10, width: 0.90, height: 0.25 },
        rear_bumper: { length: 0.10, width: 0.90, height: 0.22 }
    }
};

const DEFAULT_DIMS = DIMENSION_AVERAGES.sedan;

function calculateBodyParts(vehicleType) {
    const dims = DIMENSION_AVERAGES[vehicleType] || DEFAULT_DIMS;
    const ratios = PART_RATIOS[vehicleType] || PART_RATIOS.sedan;
    const { length_mm, width_mm, height_mm } = dims;
    const bodyParts = {};
    for (const [part, r] of Object.entries(ratios)) {
        bodyParts[part] = {
            length_mm: Math.round(length_mm * r.length),
            width_mm: Math.round(width_mm * r.width),
            height_mm: Math.round(height_mm * r.height),
            material: 'estimated'
        };
    }
    return bodyParts;
}

function loadProgress() {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        }
    } catch (e) {}
    return { lastId: null, totalUpdated: 0 };
}

function saveProgress(progress) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
}

async function updateCar(carId, vehicleType) {
    const dims = DIMENSION_AVERAGES[vehicleType] || DEFAULT_DIMS;
    const bodyParts = calculateBodyParts(vehicleType);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/cars?id=eq.${carId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            body_parts: bodyParts,
            length_mm: dims.length_mm,
            width_mm: dims.width_mm,
            height_mm: dims.height_mm
        })
    });
    return response.ok;
}

async function main() {
    const progress = loadProgress();
    let lastId = progress.lastId;
    let totalUpdated = progress.totalUpdated;
    const chunkSize = 100;
    
    console.log(`Resuming from lastId: ${lastId || 'beginning'}, total updated: ${totalUpdated}`);
    
    let hasMore = true;
    while (hasMore) {
        let url = `${SUPABASE_URL}/rest/v1/cars?select=id,vehicle_type&order=id&limit=${chunkSize}`;
        if (lastId) {
            url += `&id=gt.${lastId}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const cars = await response.json();
        
        if (!cars || cars.length === 0) {
            hasMore = false;
            continue;
        }
        
        for (const car of cars) {
            const success = await updateCar(car.id, car.vehicle_type);
            if (success) totalUpdated++;
            lastId = car.id;
        }
        
        progress.lastId = lastId;
        progress.totalUpdated = totalUpdated;
        saveProgress(progress);
        
        console.log(`Last ID: ${lastId}, Updated: ${totalUpdated}`);
        
        if (cars.length < chunkSize) {
            hasMore = false;
        }
    }
    
    console.log(`\nComplete! Total updated: ${totalUpdated}`);
    fs.unlinkSync(PROGRESS_FILE);
}

main().catch(console.error);
