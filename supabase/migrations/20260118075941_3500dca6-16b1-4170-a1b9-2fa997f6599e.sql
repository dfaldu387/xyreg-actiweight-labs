-- Add unique constraint on nb_number to enable upserts
ALTER TABLE public.notified_bodies ADD CONSTRAINT notified_bodies_nb_number_unique UNIQUE (nb_number);