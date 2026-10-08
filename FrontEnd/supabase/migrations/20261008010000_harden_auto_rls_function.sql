do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public';
    execute 'revoke execute on function public.rls_auto_enable() from anon, authenticated';
  end if;
end;
$$;

grant select, insert, update, delete on public.quiz_submissions to service_role;
grant select, insert, update, delete on public.usage_logs to service_role;
grant select, insert, update, delete on public.touchdesigner_events to service_role;
grant usage, select on sequence public.touchdesigner_events_cursor_seq to service_role;
