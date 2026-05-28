-- Add basic hue enum labels for admin/catalog (additive; legacy fancy-* remain dormant)

DO $$ BEGIN
  ALTER TYPE public.gem_color ADD VALUE 'orange';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.gem_color ADD VALUE 'gray';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.gem_color ADD VALUE 'violet';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.gem_color ADD VALUE 'brown';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
