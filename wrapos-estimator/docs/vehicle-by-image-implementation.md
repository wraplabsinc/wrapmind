# Vehicle by Image - Implementation Plan

## Overview
Add a third vehicle selection method using the device camera and Qwen2.5-VL via OpenRouter.

## Prerequisites
1. Get an OpenRouter API key at https://openrouter.ai/
2. Add it to `.env.local`:
   ```
   VITE_OPENROUTER_API_KEY=your_api_key_here
   ```

## Current Scaffold
The following files have been created/updated:

### Created
- `src/components/VehicleByImage.jsx` - Camera capture + OpenRouter API integration

### Updated
- `src/components/VinSearch.jsx` - Added "Image" tab to vehicle selection

## Implementation Steps

### Step 1: Environment Setup
Add OpenRouter API key to `.env.local`:
```bash
VITE_OPENROUTER_API_KEY=your_key_here
```

### Step 2: Validate API Key
Test that the environment variable loads correctly.

### Step 3: Test Camera Access
- Test on mobile device
- Verify camera permissions
- Check `facingMode: 'environment'` works

### Step 4: Test OpenRouter Integration
- Send test image to Qwen2.5-VL
- Verify JSON response parsing
- Check error handling

### Step 5: Connect to Supabase
The current scaffold returns raw LLM data. Need to:
1. Query Supabase to find matching vehicle from LLM response
2. Use existing RPC (or create new one) to fuzzy match year/make/model
3. Return complete vehicle object like VIN/Browse methods

### Step 6: Error Handling Verification
- Test retry logic (2 retries then fallback)
- Test camera permission denied
- Test network errors

### Step 7: UI Refinements
- Add photo preview before submitting
- Add better loading states
- Add clear error messages
- Consider image compression for faster uploads

## Known Issues in Scaffold

### Issue 1: LLM Response Not Matched to DB
**Problem**: The `VehicleByImage` component returns raw LLM output, not a Supabase vehicle record.

**Solution**: After getting LLM response, query Supabase:
```javascript
// Query to find matching vehicle
const { data } = await supabase.rpc('find_car_by_year_make_model', {
  p_year: vehicleData.year,
  p_make: vehicleData.make,
  p_model: vehicleData.model,
});
```

You may need to create a new RPC function in Supabase for fuzzy matching.

### Issue 2: No Image Storage
**Problem**: Images are captured as data URLs but not persisted.

**Solution**: Not required for MVP - images are transient. If needed later, add Supabase Storage.

### Issue 3: Hardcoded API Key Placeholder
**Problem**: Uses `import.meta.env.VITE_OPENROUTER_API_KEY` without validation.

**Solution**: Add validation in Step 2.

## Supabase RPC Suggestions

Create or modify RPC in Supabase:

```sql
-- Find car by year/make/model (fuzzy)
CREATE OR REPLACE FUNCTION find_car_by_year_make_model(
  p_year INT,
  p_make TEXT,
  p_model TEXT
)
RETURNS TABLE(...) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM vehicles
  WHERE year = p_year
    AND LOWER(make) = LOWER(p_make)
    AND LOWER(model) = LOWER(p_model)
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

## Testing Checklist
- [ ] Camera opens on iOS Safari
- [ ] Camera opens on Android Chrome
- [ ] Photo captures correctly
- [ ] API call succeeds
- [ ] Vehicle identified correctly
- [ ] Retry works (2 times)
- [ ] Fallback after max retries
- [ ] Selected vehicle flows to next step