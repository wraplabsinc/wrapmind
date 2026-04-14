-- Migration: Add more dimension references for common vehicle models
-- Uses ON CONFLICT DO NOTHING to handle duplicates gracefully

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- SUVs and Crossovers
('suv', 'midsize', 'Toyota', '4Runner', 2010, 2024, 4830, 1925, 1910, 2790, 240, 2150),
('suv', 'compact', 'Toyota', 'RAV4', 2010, 2018, 4605, 1845, 1675, 2660, 175, 1625),
('suv', 'compact', 'Toyota', 'RAV4', 2019, 2024, 4600, 1855, 1685, 2690, 195, 1700),
('suv', 'midsize', 'Toyota', 'Highlander', 2014, 2019, 4850, 1925, 1730, 2790, 200, 1975),
('suv', 'midsize', 'Toyota', 'Highlander', 2020, 2024, 4950, 1930, 1730, 2850, 205, 2085),
('suv', 'three_row', 'Toyota', 'Sequoia', 2008, 2022, 5210, 2030, 1895, 3100, 245, 2585),
('suv', 'three_row', 'Toyota', 'Sequoia', 2023, 2024, 5210, 2030, 1895, 3150, 210, 2585),
-- Trucks
('truck', 'half_ton', 'Toyota', 'Tacoma', 2016, 2024, 5360, 1900, 1795, 3235, 240, 2085),
('truck', 'half_ton', 'Toyota', 'Tundra', 2014, 2021, 5810, 2030, 1940, 3705, 250, 2550),
('truck', 'half_ton', 'Toyota', 'Tundra', 2022, 2024, 5930, 2030, 1920, 3700, 235, 2585),
-- Sedans
('sedan', 'midsize', 'Toyota', 'Camry', 2012, 2017, 4850, 1825, 1470, 2775, 145, 1510),
('sedan', 'compact', 'Toyota', 'Corolla', 2014, 2018, 4630, 1775, 1475, 2700, 145, 1380),
-- Minivan
('van', 'minivan', 'Toyota', 'Sienna', 2011, 2024, 5085, 1985, 1775, 3030, 165, 2065),
-- Hatchback
('hatchback', 'compact', 'Toyota', 'Prius', 2016, 2024, 4540, 1760, 1470, 2700, 140, 1450),
-- Crossover
('crossover', 'compact', 'Toyota', 'Corolla Cross', 2022, 2024, 4460, 1825, 1620, 2640, 190, 1630)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Honda models
('sedan', 'compact', 'Honda', 'Civic', 2016, 2021, 4645, 1790, 1435, 2698, 145, 1350),
('sedan', 'compact', 'Honda', 'Civic', 2022, 2024, 4650, 1800, 1415, 2735, 145, 1350),
('sedan', 'midsize', 'Honda', 'Accord', 2018, 2024, 4870, 1855, 1440, 2830, 145, 1490),
('suv', 'compact', 'Honda', 'HR-V', 2016, 2024, 4345, 1790, 1605, 2610, 185, 1450),
('suv', 'compact', 'Honda', 'CR-V', 2017, 2024, 4690, 1855, 1685, 2695, 185, 1650),
('suv', 'midsize', 'Honda', 'Pilot', 2016, 2024, 4940, 1995, 1795, 2819, 185, 1950),
('van', 'minivan', 'Honda', 'Odyssey', 2018, 2024, 5155, 2015, 1775, 3000, 165, 2050),
('hatchback', 'compact', 'Honda', 'Fit', 2015, 2024, 4005, 1695, 1525, 2530, 140, 1200)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Ford models
('sedan', 'midsize', 'Ford', 'Fusion', 2013, 2020, 4875, 1850, 1485, 2850, 145, 1595),
('sedan', 'midsize', 'Ford', 'Mustang', 2018, 2024, 4790, 1915, 1375, 2720, 140, 1680),
('suv', 'compact', 'Ford', 'Escape', 2017, 2024, 4605, 1885, 1720, 2710, 190, 1700),
('suv', 'compact', 'Ford', 'Bronco Sport', 2021, 2024, 4385, 1925, 1745, 2670, 200, 1750),
('suv', 'midsize', 'Ford', 'Edge', 2015, 2024, 4805, 1925, 1735, 2850, 195, 1920),
('suv', 'midsize', 'Ford', 'Explorer', 2020, 2024, 5050, 2005, 1775, 3025, 200, 1975),
('suv', 'three_row', 'Ford', 'Expedition', 2018, 2024, 5330, 2030, 1935, 3110, 250, 2560),
('truck', 'half_ton', 'Ford', 'F-150', 2015, 2020, 5890, 2030, 1920, 3685, 240, 2150),
('truck', 'half_ton', 'Ford', 'F-150', 2021, 2024, 5890, 2030, 1915, 3685, 240, 2150),
('truck', 'half_ton', 'Ford', 'Ranger', 2019, 2024, 5355, 1865, 1815, 3220, 230, 1975),
('hatchback', 'compact', 'Ford', 'Focus', 2015, 2018, 4360, 1825, 1465, 2648, 145, 1350)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Chevrolet models
('sedan', 'compact', 'Chevrolet', 'Malibu', 2016, 2024, 4925, 1855, 1450, 2835, 145, 1525),
('sedan', 'compact', 'Chevrolet', 'Cruze', 2016, 2019, 4665, 1795, 1460, 2735, 145, 1450),
('suv', 'compact', 'Chevrolet', 'Equinox', 2018, 2024, 4660, 1845, 1660, 2725, 180, 1680),
('suv', 'compact', 'Chevrolet', 'Trailblazer', 2021, 2024, 4405, 1800, 1735, 2640, 190, 1620),
('suv', 'midsize', 'Chevrolet', 'Traverse', 2018, 2024, 5185, 1995, 1795, 3070, 185, 1970),
('suv', 'three_row', 'Chevrolet', 'Tahoe', 2021, 2024, 5185, 2030, 1925, 3070, 230, 2450),
('suv', 'three_row', 'Chevrolet', 'Suburban', 2021, 2024, 5720, 2060, 1925, 3405, 230, 2600),
('truck', 'half_ton', 'Chevrolet', 'Silverado 1500', 2014, 2018, 5845, 2030, 1880, 3645, 235, 2150),
('truck', 'half_ton', 'Chevrolet', 'Silverado 1500', 2019, 2024, 5885, 2030, 1880, 3745, 235, 2150),
('truck', 'half_ton', 'Chevrolet', 'Colorado', 2015, 2024, 5395, 1885, 1790, 3255, 230, 1925),
('coupe', 'sports', 'Chevrolet', 'Camaro', 2016, 2024, 4785, 1895, 1345, 2810, 120, 1625),
('coupe', 'sports', 'Chevrolet', 'Corvette', 2020, 2024, 4610, 1935, 1225, 2725, 100, 1565)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- GMC models
('truck', 'half_ton', 'GMC', 'Sierra 1500', 2019, 2024, 5885, 2030, 1880, 3745, 235, 2180),
('truck', 'half_ton', 'GMC', 'Canyon', 2015, 2024, 5395, 1885, 1790, 3255, 230, 1950),
('suv', 'compact', 'GMC', 'Terrain', 2018, 2024, 4630, 1845, 1685, 2725, 180, 1725),
('suv', 'midsize', 'GMC', 'Acadia', 2017, 2024, 4905, 1925, 1700, 2855, 185, 1930)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- BMW models
('sedan', 'compact', 'BMW', '3 Series', 2019, 2024, 4715, 1825, 1445, 2850, 140, 1600),
('sedan', 'midsize', 'BMW', '5 Series', 2018, 2024, 4965, 1870, 1480, 2975, 145, 1750),
('sedan', 'luxury', 'BMW', '7 Series', 2019, 2024, 5260, 1950, 1535, 3210, 150, 2050),
('sedan', 'compact', 'BMW', '1 Series', 2008, 2013, 4325, 1765, 1425, 2690, 140, 1450),
('suv', 'compact', 'BMW', 'X1', 2016, 2024, 4455, 1825, 1560, 2670, 185, 1675),
('suv', 'compact', 'BMW', 'X3', 2018, 2024, 4715, 1895, 1685, 2865, 195, 1850),
('suv', 'midsize', 'BMW', 'X5', 2019, 2024, 4935, 2005, 1775, 2975, 210, 2175),
('suv', 'three_row', 'BMW', 'X7', 2019, 2024, 5185, 2005, 1835, 3105, 220, 2450)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Mercedes-Benz models
('sedan', 'midsize', 'Mercedes-Benz', 'C-Class', 2018, 2024, 4750, 1820, 1435, 2840, 145, 1650),
('sedan', 'luxury', 'Mercedes-Benz', 'E-Class', 2018, 2024, 4940, 1855, 1460, 2940, 150, 1800),
('sedan', 'fullsize', 'Mercedes-Benz', 'S-Class', 2018, 2024, 5255, 1895, 1495, 3165, 155, 2100),
('sedan', 'compact', 'Mercedes-Benz', 'A-Class', 2019, 2024, 4550, 1800, 1440, 2730, 140, 1550),
('suv', 'compact', 'Mercedes-Benz', 'GLA', 2020, 2024, 4425, 1835, 1620, 2730, 185, 1700),
('suv', 'compact', 'Mercedes-Benz', 'GLB', 2020, 2024, 4535, 1845, 1660, 2830, 190, 1750),
('suv', 'compact', 'Mercedes-Benz', 'GLC', 2019, 2024, 4715, 1890, 1645, 2875, 190, 1850),
('suv', 'midsize', 'Mercedes-Benz', 'GLE', 2020, 2024, 4940, 1955, 1715, 2995, 200, 2150),
('suv', 'three_row', 'Mercedes-Benz', 'GLS', 2020, 2024, 5210, 1955, 1825, 3135, 215, 2450)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Tesla models
('sedan', 'midsize', 'Tesla', 'Model 3', 2018, 2024, 4690, 1850, 1445, 2875, 140, 1735),
('sedan', 'midsize', 'Tesla', 'Model S', 2021, 2024, 4970, 1965, 1445, 2960, 140, 2065),
('suv', 'compact', 'Tesla', 'Model Y', 2020, 2024, 4750, 1920, 1625, 2890, 165, 2005),
('suv', 'midsize', 'Tesla', 'Model X', 2021, 2024, 5050, 1995, 1685, 2965, 165, 2355),
('truck', 'half_ton', 'Tesla', 'Cybertruck', 2024, 2026, 5605, 2203, 1905, 3430, 280, 2995)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Audi models
('sedan', 'compact', 'Audi', 'A3', 2015, 2024, 4455, 1795, 1415, 2635, 140, 1400),
('sedan', 'midsize', 'Audi', 'A4', 2017, 2024, 4765, 1845, 1430, 2820, 140, 1580),
('sedan', 'midsize', 'Audi', 'A6', 2019, 2024, 4935, 1885, 1460, 2925, 145, 1780),
('sedan', 'luxury', 'Audi', 'A8', 2019, 2024, 5300, 1950, 1485, 3125, 150, 2100),
('suv', 'compact', 'Audi', 'Q3', 2019, 2024, 4485, 1855, 1620, 2680, 185, 1700),
('suv', 'compact', 'Audi', 'Q5', 2018, 2024, 4685, 1895, 1665, 2820, 190, 1880),
('suv', 'midsize', 'Audi', 'Q7', 2017, 2024, 5065, 1970, 1740, 3000, 200, 2200),
('suv', 'midsize', 'Audi', 'Q8', 2019, 2024, 5000, 1995, 1710, 3000, 195, 2250)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Nissan models
('sedan', 'compact', 'Nissan', 'Sentra', 2019, 2024, 4645, 1815, 1445, 2715, 145, 1450),
('sedan', 'midsize', 'Nissan', 'Altima', 2019, 2024, 4905, 1855, 1445, 2825, 145, 1510),
('sedan', 'midsize', 'Nissan', 'Maxima', 2016, 2024, 4895, 1860, 1440, 2775, 140, 1600),
('suv', 'compact', 'Nissan', 'Rogue', 2021, 2024, 4650, 1840, 1695, 2705, 190, 1680),
('suv', 'midsize', 'Nissan', 'Murano', 2015, 2024, 4985, 1915, 1720, 2825, 190, 1930),
('suv', 'three_row', 'Nissan', 'Pathfinder', 2013, 2024, 5005, 1960, 1785, 2905, 200, 2025),
('suv', 'three_row', 'Nissan', 'Armada', 2017, 2024, 5285, 2030, 1925, 3075, 230, 2520),
('truck', 'half_ton', 'Nissan', 'Titan', 2017, 2024, 5785, 2030, 1930, 3800, 240, 2615),
('truck', 'half_ton', 'Nissan', 'Frontier', 2005, 2024, 5480, 1855, 1795, 3255, 230, 1995)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Hyundai models
('sedan', 'compact', 'Hyundai', 'Elantra', 2017, 2024, 4650, 1825, 1440, 2700, 145, 1350),
('sedan', 'midsize', 'Hyundai', 'Sonata', 2015, 2024, 4855, 1865, 1485, 2805, 145, 1550),
('sedan', 'midsize', 'Hyundai', 'Ioniq 6', 2023, 2024, 4855, 1880, 1495, 2950, 145, 2000),
('suv', 'compact', 'Hyundai', 'Tucson', 2022, 2024, 4505, 1865, 1660, 2680, 190, 1650),
('suv', 'compact', 'Hyundai', 'Kona', 2018, 2024, 4165, 1800, 1570, 2600, 170, 1450),
('suv', 'midsize', 'Hyundai', 'Santa Fe', 2019, 2024, 4785, 1900, 1710, 2765, 195, 1850),
('suv', 'three_row', 'Hyundai', 'Palisade', 2020, 2024, 4985, 1975, 1750, 2900, 200, 1995)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Kia models
('sedan', 'compact', 'Kia', 'Forte', 2019, 2024, 4645, 1800, 1460, 2700, 145, 1350),
('sedan', 'midsize', 'Kia', 'K5', 2021, 2024, 4905, 1860, 1465, 2850, 145, 1525),
('sedan', 'midsize', 'Kia', 'Stinger', 2018, 2024, 4835, 1870, 1400, 2905, 130, 1850),
('suv', 'compact', 'Kia', 'Sportage', 2017, 2024, 4515, 1865, 1695, 2670, 185, 1675),
('suv', 'compact', 'Kia', 'Seltos', 2019, 2024, 4375, 1800, 1635, 2630, 190, 1550),
('suv', 'midsize', 'Kia', 'Sorento', 2016, 2024, 4805, 1895, 1690, 2815, 190, 1850),
('suv', 'three_row', 'Kia', 'Telluride', 2020, 2024, 5005, 1990, 1785, 2900, 200, 2085)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Subaru models
('sedan', 'compact', 'Subaru', 'Impreza', 2017, 2024, 4625, 1775, 1455, 2670, 145, 1480),
('sedan', 'midsize', 'Subaru', 'Legacy', 2015, 2024, 4820, 1840, 1505, 2755, 150, 1620),
('sedan', 'midsize', 'Subaru', 'WRX', 2015, 2024, 4665, 1805, 1465, 2650, 140, 1520),
('suv', 'compact', 'Subaru', 'Crosstrek', 2018, 2024, 4480, 1800, 1620, 2665, 220, 1550),
('suv', 'compact', 'Subaru', 'Forester', 2019, 2024, 4640, 1825, 1710, 2670, 220, 1680),
('suv', 'midsize', 'Subaru', 'Outback', 2015, 2024, 4855, 1855, 1680, 2745, 215, 1725),
('suv', 'three_row', 'Subaru', 'Ascent', 2019, 2024, 4990, 1930, 1815, 2890, 200, 2050)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Jeep models
('suv', 'compact', 'Jeep', 'Compass', 2017, 2024, 4395, 1875, 1645, 2640, 200, 1650),
('suv', 'compact', 'Jeep', 'Renegade', 2015, 2024, 4255, 1805, 1695, 2570, 210, 1610),
('suv', 'midsize', 'Jeep', 'Cherokee', 2014, 2024, 4625, 1870, 1700, 2720, 200, 1800),
('suv', 'midsize', 'Jeep', 'Grand Cherokee', 2011, 2024, 4820, 1945, 1800, 2915, 210, 2150),
('suv', 'three_row', 'Jeep', 'Grand Cherokee L', 2021, 2024, 5110, 1970, 1835, 3090, 215, 2250),
('suv', 'three_row', 'Jeep', 'Wrangler', 2018, 2024, 4785, 1875, 1835, 3008, 250, 1995),
('van', 'minivan', 'Jeep', 'Grand Caravan', 2008, 2020, 5155, 2025, 1785, 3075, 165, 2100)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Mazda models
('sedan', 'compact', 'Mazda', 'Mazda3', 2014, 2024, 4580, 1795, 1450, 2705, 145, 1420),
('sedan', 'midsize', 'Mazda', 'Mazda6', 2018, 2024, 4865, 1840, 1450, 2830, 145, 1580),
('suv', 'compact', 'Mazda', 'CX-3', 2016, 2024, 4275, 1765, 1550, 2570, 160, 1400),
('suv', 'compact', 'Mazda', 'CX-30', 2020, 2024, 4395, 1795, 1540, 2655, 200, 1550),
('suv', 'compact', 'Mazda', 'CX-5', 2017, 2024, 4555, 1845, 1680, 2700, 195, 1700),
('suv', 'midsize', 'Mazda', 'CX-9', 2016, 2024, 5075, 1965, 1745, 2930, 200, 2050)
ON CONFLICT DO NOTHING;

INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
-- Volkswagen models
('sedan', 'compact', 'Volkswagen', 'Jetta', 2019, 2024, 4715, 1798, 1458, 2686, 145, 1450),
('sedan', 'midsize', 'Volkswagen', 'Passat', 2012, 2024, 4765, 1835, 1510, 2795, 145, 1580),
('sedan', 'compact', 'Volkswagen', 'Golf', 2015, 2024, 4255, 1799, 1482, 2637, 145, 1420),
('suv', 'compact', 'Volkswagen', 'Tiguan', 2018, 2024, 4715, 1859, 1675, 2790, 200, 1750),
('suv', 'compact', 'Volkswagen', 'Taos', 2022, 2024, 4465, 1840, 1655, 2690, 195, 1650),
('suv', 'midsize', 'Volkswagen', 'Touareg', 2018, 2024, 4875, 1985, 1720, 2905, 210, 2150)
ON CONFLICT DO NOTHING;