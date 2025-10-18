-- Add detailed logging to the trigger function to debug

CREATE OR REPLACE FUNCTION update_couple_paired_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_update_count INTEGER;
BEGIN
  RAISE NOTICE 'Trigger fired! OLD.couple_id: %, NEW.couple_id: %', OLD.couple_id, NEW.couple_id;

  IF NEW.couple_id IS NOT NULL AND OLD.couple_id IS NULL THEN
    RAISE NOTICE 'Condition met! Updating couple: % with user2_id: %', NEW.couple_id, NEW.id;

    -- Try the update
    UPDATE couples
    SET is_paired = true, user2_id = NEW.id
    WHERE id = NEW.couple_id
      AND user1_id != NEW.id;

    GET DIAGNOSTICS v_update_count = ROW_COUNT;
    RAISE NOTICE 'Update completed. Rows affected: %', v_update_count;

    IF v_update_count = 0 THEN
      RAISE NOTICE 'WARNING: No rows updated! Checking couple exists...';

      -- Check if couple exists
      IF EXISTS (SELECT 1 FROM couples WHERE id = NEW.couple_id) THEN
        RAISE NOTICE 'Couple exists but was not updated. Checking user1_id...';
        DECLARE
          v_user1_id UUID;
        BEGIN
          SELECT user1_id INTO v_user1_id FROM couples WHERE id = NEW.couple_id;
          RAISE NOTICE 'user1_id: %, NEW.id: %, Equal?: %', v_user1_id, NEW.id, v_user1_id = NEW.id;
        END;
      ELSE
        RAISE NOTICE 'ERROR: Couple does not exist!';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Condition not met. Skipping update.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also, let's add a policy that explicitly allows updating couples when setting user2_id
DROP POLICY IF EXISTS "Allow setting user2_id when joining" ON couples;

CREATE POLICY "Allow setting user2_id when joining"
  ON couples FOR UPDATE
  USING (
    -- Allow update if we're setting user2_id from NULL
    user2_id IS NULL AND NOT is_paired
  )
  WITH CHECK (
    -- After update, user2_id should be set and is_paired should be true
    user2_id IS NOT NULL
  );
