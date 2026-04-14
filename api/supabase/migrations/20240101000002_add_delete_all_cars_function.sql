-- Migration: Add helper function to delete all cars
CREATE OR REPLACE FUNCTION delete_all_cars()
RETURNS void AS $$
BEGIN
    DELETE FROM cars;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
