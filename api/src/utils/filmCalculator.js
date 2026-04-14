const config = require('../config');

function calculateFilmRequirements(vehicleClass, services, settings) {
  const classData = config.vehicleClasses[vehicleClass];
  if (!classData) {
    throw new Error(`Unknown vehicle class: ${vehicleClass}`);
  }

  const baseRawFootage = classData.rawFootage;
  const wasteFactor = classData.waste;
  const orderFootage = baseRawFootage * (1 + wasteFactor);

  const addons = calculateAddons(services);
  const totalRawFootage = baseRawFootage + addons.totalAddonFootage;
  const totalOrderFootage = totalRawFootage * (1 + wasteFactor);

  const linearFeet = totalOrderFootage;
  const linearYards = totalOrderFootage / 3;
  const roundedYards = Math.ceil(linearYards * 2) / 2;

  const filmPrefs = settings?.film_prefs_json || [];
  const activeFilms = filmPrefs.filter((f) => f.active);

  return {
    vehicle_class: vehicleClass,
    base_raw_footage: baseRawFootage,
    base_waste_pct: wasteFactor * 100,
    base_order_footage: orderFootage,
    addons: addons.breakdown,
    total_raw_footage: totalRawFootage,
    total_order_footage: totalOrderFootage,
    linear_feet: linearFeet,
    linear_yards: linearYards,
    yards_to_order: roundedYards,
    film_options: activeFilms.map((film) => ({
      sku_id: film.sku_id,
      brand: film.brand,
      product_name: film.product_name,
      roll_width: film.roll_width_inches,
      cost_per_yard: film.cost_per_yard,
      total_material_cost: roundedYards * film.cost_per_yard,
    })),
  };
}

function calculateAddons(services) {
  let totalAddonFootage = 0;
  const breakdown = [];

  if (!services || !Array.isArray(services)) {
    return { totalAddonFootage: 0, breakdown: [] };
  }

  for (const service of services) {
    if (service.door_jambs) {
      const footage = 10;
      totalAddonFootage += footage;
      breakdown.push({ item: 'Door jambs', footage });
    }
    if (service.racing_stripes) {
      const footage = 8;
      totalAddonFootage += footage;
      breakdown.push({ item: 'Racing stripes', footage });
    }
    if (service.roof_only) {
      const footage = 0;
      breakdown.push({ item: 'Roof only', note: '×0.30 multiplier on base' });
    }
    if (service.blackout) {
      const blackoutParts = service.blackout_parts || [];
      const partFootage = {
        front_grille: 2.3,
        front_bumper_trim: 3.45,
        side_mirror_caps: 1.73,
        window_surrounds: 4.6,
        door_handles: 1.15,
      };
      for (const part of blackoutParts) {
        const ft = partFootage[part] || 0;
        totalAddonFootage += ft;
        breakdown.push({ item: `Blackout: ${part.replace(/_/g, ' ')}`, footage: ft });
      }
    }
  }

  return { totalAddonFootage, breakdown };
}

module.exports = { calculateFilmRequirements };
