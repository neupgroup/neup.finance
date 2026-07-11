/*
  Creates the new fin_account table and moves the existing book table to
  fin_book without breaking existing data.
*/

DO $$
BEGIN
  IF to_regclass('public.fin_book') IS NULL AND to_regclass('public.book') IS NOT NULL THEN
    ALTER TABLE public.book RENAME TO fin_book;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.fin_account (
  id text PRIMARY KEY,
  profile_id text NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL,
  currency text NOT NULL,
  is_multi_currency boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  notes text,
  opened_on timestamptz,
  created_on timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fin_account_profile_id_idx
  ON public.fin_account (profile_id);

CREATE INDEX IF NOT EXISTS fin_account_status_idx
  ON public.fin_account (status);

DO $$
BEGIN
  IF to_regclass('public.fin_book') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'fin_book'
        AND column_name = 'accountId'
    ) THEN
      CREATE INDEX IF NOT EXISTS fin_book_account_id_idx
        ON public.fin_book ("accountId");
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'fin_book'
        AND column_name = 'account_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS fin_book_account_id_idx
        ON public.fin_book (account_id);
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS transaction_line_fin_account_idx
  ON public.transaction_line (fin_account);
