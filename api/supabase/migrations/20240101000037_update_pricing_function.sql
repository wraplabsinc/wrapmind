-- Update calculate_package_price to show both wholesale and retail pricing

CREATE OR REPLACE FUNCTION calculate_package_price(
    p_package_id UUID,
    p_car_id UUID,
    p_material_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_package RECORD;
    v_car RECORD;
    v_material RECORD;
    v_material_row RECORD;
    v_size_class VARCHAR(20);
    v_size_multiplier DECIMAL(10,2);
    v_wrap_sqft DECIMAL(10,2);
    v_material_cost_retail DECIMAL(10,2);
    v_material_cost_wholesale DECIMAL(10,2);
    v_labor_cost DECIMAL(10,2);
    v_base_cost DECIMAL(10,2);
    v_total_cost_retail DECIMAL(10,2);
    v_total_cost_wholesale DECIMAL(10,2);
BEGIN
    -- Get package info
    SELECT * INTO v_package FROM wrap_packages WHERE id = p_package_id AND is_active = true;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Package not found');
    END IF;
    
    -- Get car info
    SELECT * INTO v_car FROM cars WHERE id = p_car_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Car not found');
    END IF;
    
    -- Determine size class
    v_size_class := get_vehicle_size_class(v_car.length_mm, v_car.vehicle_type);
    
    -- Get size multiplier
    SELECT size_multiplier INTO v_size_multiplier
    FROM vehicle_size_multipliers
    WHERE vehicle_type = v_car.vehicle_type AND size_class = v_size_class;
    
    IF v_size_multiplier IS NULL THEN
        v_size_multiplier := 1.00;
    END IF;
    
    -- Get wrap coverage (sq ft) for this car
    v_wrap_sqft := ((calculate_wrap_from_body_parts(v_car.body_parts)->>'total_sq_feet')::DECIMAL * 
        (v_package.coverage_area->>'percentage')::INTEGER / 100);
    
    -- Determine material
    IF p_material_id IS NOT NULL THEN
        SELECT * INTO v_material FROM wrap_materials WHERE id = p_material_id AND is_active = true;
    ELSE
        -- Get default material for package (cheapest compatible)
        SELECT m.* INTO v_material
        FROM package_materials pm
        JOIN wrap_materials m ON m.id = pm.material_id
        WHERE pm.package_id = p_package_id
        ORDER BY m.price_per_sqft ASC
        LIMIT 1;
    END IF;
    
    -- Get material multiplier for this package/material combo
    SELECT material_multiplier INTO v_material_row
    FROM package_materials
    WHERE package_id = p_package_id AND material_id = v_material.id;
    
    -- Calculate material costs (retail and wholesale)
    v_material_cost_retail := v_wrap_sqft * v_material.price_per_sqft * 
        COALESCE(v_material_row.material_multiplier, 1.00);
    v_material_cost_wholesale := v_wrap_sqft * v_material.wholesale_price * 
        COALESCE(v_material_row.material_multiplier, 1.00);
    
    v_labor_cost := v_package.labor_hours * v_package.labor_rate_per_hour;
    v_base_cost := v_package.base_cost;
    
    -- Total costs (retail and wholesale)
    v_total_cost_retail := (v_material_cost_retail + v_labor_cost + v_base_cost) * v_size_multiplier;
    v_total_cost_wholesale := (v_material_cost_wholesale + v_labor_cost + v_base_cost) * v_size_multiplier;
    
    RETURN jsonb_build_object(
        'package_name', v_package.name,
        'package_code', v_package.code,
        'material_name', v_material.name,
        'material_code', v_material.code,
        'material_retail_price_per_sqft', v_material.price_per_sqft,
        'material_wholesale_price_per_sqft', v_material.wholesale_price,
        'vehicle', jsonb_build_object(
            'year', v_car.year,
            'make', v_car.make,
            'model', v_car.model,
            'vehicle_type', v_car.vehicle_type,
            'size_class', v_size_class
        ),
        'calculations', jsonb_build_object(
            'coverage_percentage', v_package.coverage_area->>'percentage',
            'wrap_sqft', ROUND(v_wrap_sqft, 2),
            'material_multiplier', COALESCE(v_material_row.material_multiplier, 1.00),
            'labor_hours', v_package.labor_hours,
            'labor_rate', v_package.labor_rate_per_hour,
            'size_multiplier', v_size_multiplier
        ),
        'pricing', jsonb_build_object(
            'wholesale', jsonb_build_object(
                'material_cost', ROUND(v_material_cost_wholesale * v_size_multiplier, 2),
                'labor_cost', ROUND(v_labor_cost * v_size_multiplier, 2),
                'total_cost', ROUND(v_total_cost_wholesale, 2)
            ),
            'retail', jsonb_build_object(
                'material_cost', ROUND(v_material_cost_retail * v_size_multiplier, 2),
                'labor_cost', ROUND(v_labor_cost * v_size_multiplier, 2),
                'total_cost', ROUND(v_total_cost_retail, 2),
                'total_cost_with_30pct_margin', ROUND(v_total_cost_retail * 1.30, 2)
            ),
            'margin', jsonb_build_object(
                'amount', ROUND(v_total_cost_retail - v_total_cost_wholesale, 2),
                'percentage', ROUND(((v_total_cost_retail - v_total_cost_wholesale) / NULLIF(v_total_cost_wholesale, 0)) * 100, 1)
            )
        )
    );
END;
$$ LANGUAGE plpgsql;