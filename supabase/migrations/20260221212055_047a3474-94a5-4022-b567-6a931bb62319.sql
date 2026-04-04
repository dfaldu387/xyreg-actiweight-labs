
-- Trigger function to auto-sync projected_launch_date and actual_launch_date from markets JSON
CREATE OR REPLACE FUNCTION public.sync_launch_dates_from_markets()
RETURNS TRIGGER AS $$
DECLARE
  markets_array jsonb;
  market jsonb;
  earliest_actual text;
  earliest_projected text;
  market_date text;
BEGIN
  -- Parse markets JSON (stored as jsonb or text)
  BEGIN
    IF NEW.markets IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- markets can be jsonb array or text containing JSON
    IF pg_typeof(NEW.markets)::text = 'jsonb' THEN
      markets_array := NEW.markets;
    ELSE
      markets_array := NEW.markets::jsonb;
    END IF;
    
    -- Ensure it's an array
    IF jsonb_typeof(markets_array) != 'array' THEN
      RETURN NEW;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  -- Iterate through markets to find earliest dates
  FOR market IN SELECT * FROM jsonb_array_elements(markets_array)
  LOOP
    -- Skip unselected markets
    IF NOT (market->>'selected')::boolean THEN
      CONTINUE;
    END IF;

    -- Actual launch date: from markets with marketLaunchStatus = 'launched'
    IF market->>'marketLaunchStatus' = 'launched' THEN
      market_date := COALESCE(market->>'actualLaunchDate', market->>'launchDate');
      IF market_date IS NOT NULL AND market_date != '' THEN
        IF earliest_actual IS NULL OR market_date < earliest_actual THEN
          earliest_actual := market_date;
        END IF;
      END IF;
    END IF;

    -- Projected launch date: from any selected market's launchDate (planned date)
    market_date := market->>'launchDate';
    IF market_date IS NOT NULL AND market_date != '' THEN
      IF earliest_projected IS NULL OR market_date < earliest_projected THEN
        earliest_projected := market_date;
      END IF;
    END IF;
  END LOOP;

  -- Update the product-level dates (only if we found market dates)
  IF earliest_actual IS NOT NULL THEN
    NEW.actual_launch_date := earliest_actual::date;
  END IF;
  
  IF earliest_projected IS NOT NULL THEN
    NEW.projected_launch_date := earliest_projected::date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS sync_launch_dates_trigger ON public.products;

-- Create trigger that fires before insert or update on markets column
CREATE TRIGGER sync_launch_dates_trigger
  BEFORE INSERT OR UPDATE OF markets ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_launch_dates_from_markets();
