CREATE OR REPLACE FUNCTION batch_update_cars(cars JSONB)
RETURNS void AS $$
DECLARE
    car_record JSONB;
BEGIN
    FOR car_record IN SELECT * FROM jsonb_array_elements(cars)
    LOOP
        UPDATE cars 
        SET body_parts = car_record->'body_parts',
            length_mm = (car_record->>'length_mm')::INTEGER,
            width_mm = (car_record->>'width_mm')::INTEGER,
            height_mm = (car_record->>'height_mm')::INTEGER
        WHERE id = car_record->>'id';
    END LOOP;
END;
$$ LANGUAGE plpgsql;
