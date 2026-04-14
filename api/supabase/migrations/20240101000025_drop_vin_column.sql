-- Migration: Remove unused vin column from cars table

ALTER TABLE cars DROP COLUMN IF EXISTS vin;