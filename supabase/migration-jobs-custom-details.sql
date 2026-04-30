-- Optional free-form "custom details" the owner adds on the Post Job
-- wizard alongside the role-templated description. Lets each posting
-- carry restaurant-specific notes (parking, meals, dress code, etc.)
-- without bloating the boilerplate description text.

alter table public.jobs
  add column if not exists custom_details text;
