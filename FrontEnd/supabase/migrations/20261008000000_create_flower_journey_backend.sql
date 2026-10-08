create extension if not exists pgcrypto;

create table public.quiz_submissions (
  submission_id uuid primary key,
  submitted_at timestamptz,
  full_name text check (full_name is null or char_length(full_name) between 1 and 120),
  age smallint check (age is null or age between 13 and 120),
  occupation text check (occupation is null or char_length(occupation) between 1 and 120),
  consent_accepted boolean,
  consent_accepted_at timestamptz,
  privacy_notice_version text check (
    privacy_notice_version is null or char_length(privacy_notice_version) <= 40
  ),
  answers jsonb check (
    answers is null or (
      jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) = 7
    )
  ),
  result_emotion text check (
    result_emotion is null or result_emotion in (
      'Hope', 'Anxiety', 'Serenity', 'Sadness', 'Frustration'
    )
  ),
  flower text check (flower is null or char_length(flower) <= 80),
  result_title text check (result_title is null or char_length(result_title) <= 120),
  flower_nickname text check (
    flower_nickname is null or char_length(flower_nickname) between 1 and 7
  ),
  nickname_submitted_at timestamptz,
  feedback text check (feedback is null or char_length(feedback) between 1 and 500),
  feedback_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint completed_submission_has_required_fields check (
    submitted_at is null or (
      full_name is not null and
      age is not null and
      occupation is not null and
      answers is not null and
      result_emotion is not null and
      flower is not null and
      result_title is not null
    )
  )
);

create table public.usage_logs (
  event_id uuid primary key,
  session_id uuid not null,
  submission_id uuid,
  event_type text not null check (
    event_type in ('page_view', 'button_click', 'answer_select', 'form_submit')
  ),
  page text not null check (char_length(page) between 1 and 80),
  target text not null check (char_length(target) between 1 and 120),
  occurred_at timestamptz not null,
  details jsonb not null default '{}'::jsonb,
  path text check (path is null or char_length(path) <= 300),
  referrer text check (referrer is null or char_length(referrer) <= 300),
  user_agent text check (user_agent is null or char_length(user_agent) <= 500),
  language text check (language is null or char_length(language) <= 40),
  viewport text check (viewport is null or char_length(viewport) <= 40),
  screen text check (screen is null or char_length(screen) <= 40),
  timezone text check (timezone is null or char_length(timezone) <= 80),
  created_at timestamptz not null default now()
);

create table public.touchdesigner_events (
  cursor bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  event_type text not null check (event_type in ('result', 'nickname_updated')),
  submission_id uuid not null references public.quiz_submissions(submission_id) on delete cascade,
  emotion text not null check (
    emotion in ('Hope', 'Anxiety', 'Serenity', 'Sadness', 'Frustration')
  ),
  flower_id text not null check (
    flower_id in ('sunflower', 'lavender', 'daisy', 'striped_carnation', 'dandelion')
  ),
  flower text not null,
  result_title text not null,
  visual_index smallint not null check (visual_index between 0 and 4),
  flower_nickname text check (
    flower_nickname is null or char_length(flower_nickname) between 1 and 7
  ),
  nickname_submitted_at timestamptz,
  submitted_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index quiz_submissions_submitted_at_idx
  on public.quiz_submissions (submitted_at desc)
  where submitted_at is not null;
create index usage_logs_created_at_idx on public.usage_logs (created_at desc);
create index usage_logs_session_id_idx on public.usage_logs (session_id);
create index touchdesigner_events_created_at_idx
  on public.touchdesigner_events (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger quiz_submissions_set_updated_at
before update on public.quiz_submissions
for each row execute function public.set_updated_at();

create or replace function public.queue_touchdesigner_event()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  mapped_flower_id text;
  mapped_visual_index smallint;
  is_first_completion boolean;
begin
  if tg_op = 'INSERT' then
    is_first_completion := new.submitted_at is not null;
  else
    is_first_completion := new.submitted_at is not null and old.submitted_at is null;
  end if;

  if new.submitted_at is null or new.result_emotion is null then
    return new;
  end if;

  select flower_id, visual_index
    into mapped_flower_id, mapped_visual_index
  from (
    values
      ('Hope', 'sunflower', 0::smallint),
      ('Anxiety', 'lavender', 1::smallint),
      ('Serenity', 'daisy', 2::smallint),
      ('Sadness', 'striped_carnation', 3::smallint),
      ('Frustration', 'dandelion', 4::smallint)
  ) as flower_map(emotion, flower_id, visual_index)
  where emotion = new.result_emotion;

  if is_first_completion then
    insert into public.touchdesigner_events (
      event_type,
      submission_id,
      emotion,
      flower_id,
      flower,
      result_title,
      visual_index,
      flower_nickname,
      nickname_submitted_at,
      submitted_at
    ) values (
      'result',
      new.submission_id,
      new.result_emotion,
      mapped_flower_id,
      new.flower,
      new.result_title,
      mapped_visual_index,
      new.flower_nickname,
      new.nickname_submitted_at,
      new.submitted_at
    );
  elsif tg_op = 'UPDATE' and
    new.flower_nickname is distinct from old.flower_nickname and
    new.flower_nickname is not null then
    insert into public.touchdesigner_events (
      event_type,
      submission_id,
      emotion,
      flower_id,
      flower,
      result_title,
      visual_index,
      flower_nickname,
      nickname_submitted_at,
      submitted_at
    ) values (
      'nickname_updated',
      new.submission_id,
      new.result_emotion,
      mapped_flower_id,
      new.flower,
      new.result_title,
      mapped_visual_index,
      new.flower_nickname,
      new.nickname_submitted_at,
      new.submitted_at
    );
  end if;

  return new;
end;
$$;

create trigger quiz_submissions_queue_touchdesigner_event
after insert or update on public.quiz_submissions
for each row execute function public.queue_touchdesigner_event();

alter table public.quiz_submissions enable row level security;
alter table public.usage_logs enable row level security;
alter table public.touchdesigner_events enable row level security;

revoke all on public.quiz_submissions from anon, authenticated;
revoke all on public.usage_logs from anon, authenticated;
revoke all on public.touchdesigner_events from anon, authenticated;
revoke all on sequence public.touchdesigner_events_cursor_seq from anon, authenticated;
