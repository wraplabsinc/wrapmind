-- Migration: Add more dimension references covering older years and more models

-- Honda - extend year ranges
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'midsize', 'Honda', 'Accord', 2014, 2017, 4860, 1850, 1465, 2775, 145, 1520),
('sedan', 'midsize', 'Honda', 'Accord', 2010, 2013, 4945, 1845, 1475, 2780, 145, 1530),
('sedan', 'midsize', 'Honda', 'Accord', 2008, 2009, 4930, 1845, 1465, 2740, 145, 1505),
('sedan', 'compact', 'Honda', 'Civic', 2012, 2015, 4555, 1755, 1430, 2670, 145, 1320),
('sedan', 'compact', 'Honda', 'Civic', 2006, 2011, 4545, 1750, 1440, 2620, 145, 1280),
('suv', 'compact', 'Honda', 'CR-V', 2012, 2016, 4605, 1820, 1675, 2620, 185, 1600),
('suv', 'compact', 'Honda', 'CR-V', 2007, 2011, 4595, 1820, 1680, 2630, 185, 1580),
('hatchback', 'compact', 'Honda', 'Fit', 2009, 2014, 4090, 1695, 1525, 2500, 140, 1150)
ON CONFLICT DO NOTHING;

-- Ford - extend ranges and add missing models
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('suv', 'compact', 'Ford', 'Bronco', 2021, 2024, 4810, 2170, 1870, 2950, 260, 2150),
('suv', 'compact', 'Ford', 'Bronco Sport', 2021, 2024, 4385, 1925, 1745, 2670, 200, 1750),
('sedan', 'midsize', 'Ford', 'Fusion', 2013, 2020, 4875, 1850, 1485, 2850, 145, 1595),
('sedan', 'midsize', 'Ford', 'Fusion', 2010, 2012, 4850, 1835, 1480, 2850, 145, 1580),
('truck', 'half_ton', 'Ford', 'F-150', 2011, 2014, 5720, 2020, 1920, 3685, 240, 2150),
('truck', 'half_ton', 'Ford', 'F-150', 2009, 2010, 5690, 2020, 1945, 3685, 240, 2180),
('truck', 'half_ton', 'Ford', 'Ranger', 2011, 2012, 5355, 1865, 1815, 3220, 230, 1975),
('suv', 'compact', 'Ford', 'Escape', 2013, 2016, 4525, 1835, 1700, 2690, 190, 1680),
('suv', 'midsize', 'Ford', 'Explorer', 2011, 2019, 4970, 1985, 1780, 2865, 200, 1950),
('suv', 'three_row', 'Ford', 'Expedition', 2007, 2017, 5230, 2005, 1975, 3020, 250, 2560)
ON CONFLICT DO NOTHING;

-- Chevrolet - extend ranges
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Chevrolet', 'Malibu', 2011, 2015, 4855, 1855, 1460, 2835, 145, 1520),
('sedan', 'compact', 'Chevrolet', 'Cruze', 2011, 2015, 4595, 1795, 1475, 2685, 145, 1420),
('suv', 'compact', 'Chevrolet', 'Equinox', 2010, 2017, 4785, 1845, 1685, 2855, 180, 1750),
('suv', 'three_row', 'Chevrolet', 'Tahoe', 2007, 2020, 5130, 2010, 1955, 2945, 230, 2450),
('suv', 'three_row', 'Chevrolet', 'Suburban', 2007, 2020, 5640, 2010, 1955, 3302, 230, 2600),
('truck', 'half_ton', 'Chevrolet', 'Silverado 1500', 2007, 2013, 5845, 2030, 1880, 3645, 235, 2150),
('truck', 'half_ton', 'Chevrolet', 'Colorado', 2004, 2014, 5395, 1885, 1790, 3255, 230, 1925)
ON CONFLICT DO NOTHING;

-- Nissan - add missing models
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Nissan', 'Sentra', 2013, 2018, 4615, 1800, 1495, 2700, 145, 1400),
('sedan', 'compact', 'Nissan', 'Sentra', 2007, 2012, 4565, 1765, 1485, 2700, 145, 1380),
('sedan', 'midsize', 'Nissan', 'Altima', 2014, 2018, 4855, 1830, 1455, 2775, 145, 1520),
('sedan', 'midsize', 'Nissan', 'Altima', 2007, 2013, 4805, 1795, 1480, 2775, 145, 1500),
('suv', 'compact', 'Nissan', 'Rogue', 2008, 2020, 4670, 1830, 1710, 2690, 190, 1620),
('suv', 'midsize', 'Nissan', 'Murano', 2009, 2014, 4885, 1910, 1720, 2825, 190, 1930),
('suv', 'three_row', 'Nissan', 'Pathfinder', 2005, 2012, 4870, 1860, 1825, 2905, 200, 2025),
('suv', 'three_row', 'Nissan', 'Armada', 2004, 2016, 5285, 2030, 1925, 3075, 230, 2520)
ON CONFLICT DO NOTHING;

-- Hyundai
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Hyundai', 'Elantra', 2011, 2016, 4530, 1775, 1445, 2700, 145, 1320),
('sedan', 'compact', 'Hyundai', 'Elantra', 2006, 2010, 4510, 1775, 1450, 2610, 145, 1250),
('sedan', 'midsize', 'Hyundai', 'Sonata', 2010, 2014, 4800, 1835, 1470, 2795, 145, 1550),
('sedan', 'midsize', 'Hyundai', 'Sonata', 2006, 2009, 4800, 1835, 1480, 2745, 145, 1520),
('suv', 'compact', 'Hyundai', 'Tucson', 2016, 2021, 4475, 1855, 1645, 2670, 190, 1650),
('suv', 'compact', 'Hyundai', 'Tucson', 2010, 2015, 4440, 1855, 1665, 2645, 190, 1620),
('suv', 'compact', 'Hyundai', 'Kona', 2018, 2024, 4165, 1800, 1570, 2600, 170, 1450),
('suv', 'midsize', 'Hyundai', 'Santa Fe', 2013, 2018, 4905, 1880, 1690, 2800, 195, 1850),
('suv', 'midsize', 'Hyundai', 'Santa Fe', 2007, 2012, 4685, 1890, 1725, 2705, 195, 1825)
ON CONFLICT DO NOTHING;

-- Kia
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Kia', 'Forte', 2010, 2018, 4515, 1775, 1460, 2650, 145, 1320),
('sedan', 'midsize', 'Kia', 'Optima', 2011, 2015, 4845, 1830, 1455, 2795, 145, 1550),
('sedan', 'midsize', 'Kia', 'Optima', 2006, 2010, 4805, 1830, 1480, 2745, 145, 1520),
('suv', 'compact', 'Kia', 'Sportage', 2011, 2016, 4445, 1855, 1640, 2640, 185, 1675),
('suv', 'compact', 'Kia', 'Sportage', 2005, 2010, 4445, 1845, 1685, 2635, 185, 1625),
('suv', 'midsize', 'Kia', 'Sorento', 2007, 2015, 4685, 1885, 1755, 2705, 190, 1850),
('suv', 'three_row', 'Kia', 'Telluride', 2020, 2024, 5005, 1990, 1785, 2900, 200, 2085)
ON CONFLICT DO NOTHING;

-- Subaru
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Subaru', 'Impreza', 2012, 2016, 4580, 1740, 1465, 2645, 145, 1480),
('sedan', 'compact', 'Subaru', 'Impreza', 2008, 2011, 4465, 1740, 1475, 2620, 145, 1450),
('sedan', 'midsize', 'Subaru', 'Legacy', 2010, 2014, 4790, 1820, 1510, 2750, 150, 1620),
('sedan', 'midsize', 'Subaru', 'Legacy', 2005, 2009, 4730, 1775, 1525, 2750, 150, 1600),
('suv', 'compact', 'Subaru', 'Crosstrek', 2013, 2017, 4450, 1780, 1615, 2640, 220, 1550),
('suv', 'compact', 'Subaru', 'Forester', 2014, 2018, 4595, 1815, 1735, 2640, 220, 1680),
('suv', 'compact', 'Subaru', 'Forester', 2009, 2013, 4595, 1780, 1680, 2620, 220, 1620),
('suv', 'midsize', 'Subaru', 'Outback', 2010, 2014, 4790, 1820, 1690, 2745, 215, 1725),
('suv', 'three_row', 'Subaru', 'Ascent', 2019, 2024, 4990, 1930, 1815, 2890, 200, 2050)
ON CONFLICT DO NOTHING;

-- Jeep
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('suv', 'compact', 'Jeep', 'Compass', 2007, 2017, 4465, 1810, 1665, 2640, 200, 1650),
('suv', 'compact', 'Jeep', 'Renegade', 2015, 2024, 4255, 1805, 1695, 2570, 210, 1610),
('suv', 'midsize', 'Jeep', 'Cherokee', 2014, 2024, 4625, 1870, 1700, 2720, 200, 1800),
('suv', 'midsize', 'Jeep', 'Grand Cherokee', 2011, 2024, 4820, 1945, 1800, 2915, 210, 2150),
('suv', 'midsize', 'Jeep', 'Grand Cherokee', 2005, 2010, 4760, 1885, 1765, 2780, 210, 2050),
('suv', 'three_row', 'Jeep', 'Grand Cherokee L', 2021, 2024, 5110, 1970, 1835, 3090, 215, 2250),
('suv', 'three_row', 'Jeep', 'Wrangler', 2007, 2017, 4225, 1875, 1865, 2425, 250, 1995),
('van', 'minivan', 'Jeep', 'Grand Caravan', 2008, 2020, 5155, 2025, 1785, 3075, 165, 2100)
ON CONFLICT DO NOTHING;

-- Mazda
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Mazda', 'Mazda3', 2010, 2013, 4590, 1755, 1470, 2640, 145, 1420),
('sedan', 'compact', 'Mazda', 'Mazda3', 2006, 2009, 4515, 1755, 1465, 2640, 145, 1380),
('sedan', 'midsize', 'Mazda', 'Mazda6', 2006, 2017, 4920, 1840, 1480, 2750, 145, 1580),
('suv', 'compact', 'Mazda', 'CX-3', 2016, 2024, 4275, 1765, 1550, 2570, 160, 1400),
('suv', 'compact', 'Mazda', 'CX-5', 2013, 2016, 4555, 1840, 1675, 2700, 195, 1700),
('suv', 'compact', 'Mazda', 'CX-5', 2017, 2024, 4555, 1845, 1680, 2700, 195, 1700),
('suv', 'midsize', 'Mazda', 'CX-9', 2007, 2015, 5080, 1930, 1770, 2875, 200, 2050)
ON CONFLICT DO NOTHING;

-- Volkswagen
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Volkswagen', 'Jetta', 2011, 2018, 4665, 1798, 1458, 2651, 145, 1450),
('sedan', 'compact', 'Volkswagen', 'Jetta', 2005, 2010, 4545, 1781, 1458, 2578, 145, 1400),
('sedan', 'midsize', 'Volkswagen', 'Passat', 2006, 2010, 4775, 1830, 1475, 2710, 145, 1580),
('sedan', 'compact', 'Volkswagen', 'Golf', 2015, 2024, 4255, 1799, 1482, 2637, 145, 1420),
('sedan', 'compact', 'Volkswagen', 'Golf', 2010, 2014, 4195, 1775, 1475, 2575, 145, 1380),
('suv', 'compact', 'Volkswagen', 'Tiguan', 2009, 2017, 4435, 1809, 1663, 2603, 200, 1750),
('suv', 'compact', 'Volkswagen', 'Tiguan', 2018, 2024, 4715, 1859, 1675, 2790, 200, 1750)
ON CONFLICT DO NOTHING;

-- Dodge
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'midsize', 'Dodge', 'Charger', 2006, 2024, 5045, 1905, 1480, 3050, 145, 1850),
('coupe', 'sports', 'Dodge', 'Challenger', 2008, 2024, 5020, 1925, 1450, 2950, 130, 1700),
('suv', 'midsize', 'Dodge', 'Durango', 2011, 2024, 5010, 1930, 1785, 3045, 200, 2250),
('suv', 'midsize', 'Dodge', 'Journey', 2009, 2020, 4890, 1840, 1695, 2895, 190, 1850),
('van', 'minivan', 'Dodge', 'Grand Caravan', 2008, 2020, 5155, 2025, 1785, 3075, 165, 2100)
ON CONFLICT DO NOTHING;

-- Lexus (Toyota luxury brand)
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Lexus', 'IS', 2014, 2020, 4655, 1810, 1430, 2800, 140, 1680),
('sedan', 'midsize', 'Lexus', 'ES', 2013, 2018, 4905, 1820, 1450, 2820, 145, 1750),
('sedan', 'midsize', 'Lexus', 'ES', 2019, 2024, 4975, 1865, 1445, 2870, 145, 1780),
('sedan', 'midsize', 'Lexus', 'GS', 2012, 2020, 4855, 1840, 1465, 2850, 140, 1750),
('sedan', 'luxury', 'Lexus', 'LS', 2013, 2017, 5090, 1875, 1465, 2970, 150, 2050),
('sedan', 'luxury', 'Lexus', 'LS', 2018, 2024, 5235, 1900, 1465, 3125, 150, 2100),
('suv', 'compact', 'Lexus', 'NX', 2015, 2021, 4640, 1870, 1650, 2660, 190, 1800),
('suv', 'compact', 'Lexus', 'NX', 2022, 2024, 4660, 1865, 1660, 2690, 190, 1850),
('suv', 'midsize', 'Lexus', 'RX', 2016, 2024, 4890, 1895, 1710, 2790, 200, 2000),
('suv', 'three_row', 'Lexus', 'GX', 2010, 2024, 4890, 1925, 1885, 2800, 220, 2300)
ON CONFLICT DO NOTHING;

-- Acura (Honda luxury brand)
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'compact', 'Acura', 'ILX', 2013, 2022, 4620, 1795, 1415, 2770, 145, 1520),
('sedan', 'midsize', 'Acura', 'TLX', 2015, 2020, 4835, 1855, 1445, 2775, 145, 1600),
('sedan', 'midsize', 'Acura', 'TLX', 2021, 2024, 4825, 1925, 1465, 2870, 145, 1650),
('sedan', 'midsize', 'Acura', 'RLX', 2014, 2020, 4985, 1895, 1465, 2850, 145, 1850),
('suv', 'compact', 'Acura', 'RDX', 2013, 2018, 4690, 1875, 1665, 2685, 190, 1750),
('suv', 'compact', 'Acura', 'RDX', 2019, 2024, 4745, 1925, 1665, 2750, 195, 1825),
('suv', 'midsize', 'Acura', 'MDX', 2014, 2020, 4985, 1965, 1735, 2825, 185, 2030),
('suv', 'midsize', 'Acura', 'MDX', 2021, 2024, 5055, 2000, 1725, 2915, 185, 2100)
ON CONFLICT DO NOTHING;

-- Infiniti (Nissan luxury brand)
INSERT INTO dimension_references (vehicle_type, size_class, make, model, year_start, year_end, length_mm, width_mm, height_mm, wheelbase_mm, ground_clearance_mm, curb_weight_kg) VALUES
('sedan', 'midsize', 'Infiniti', 'Q50', 2014, 2024, 4795, 1820, 1455, 2850, 140, 1700),
('sedan', 'midsize', 'Infiniti', 'Q70', 2014, 2019, 4980, 1850, 1510, 2900, 145, 1850),
('sedan', 'compact', 'Infiniti', 'Q30', 2017, 2019, 4425, 1805, 1475, 2700, 140, 1550),
('suv', 'compact', 'Infiniti', 'QX30', 2017, 2019, 4425, 1805, 1500, 2700, 190, 1650),
('suv', 'compact', 'Infiniti', 'QX50', 2019, 2024, 4695, 1900, 1680, 2800, 195, 1850),
('suv', 'midsize', 'Infiniti', 'QX60', 2013, 2024, 5005, 1960, 1750, 2900, 200, 2050),
('suv', 'midsize', 'Infiniti', 'QX80', 2011, 2024, 5265, 2030, 1925, 3075, 230, 2550)
ON CONFLICT DO NOTHING;