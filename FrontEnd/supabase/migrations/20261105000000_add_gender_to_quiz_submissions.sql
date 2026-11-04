alter table public.quiz_submissions
  add column if not exists gender text
  check (gender is null or char_length(gender) between 1 and 80);
