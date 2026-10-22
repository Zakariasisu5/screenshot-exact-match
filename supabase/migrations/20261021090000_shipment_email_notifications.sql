create table public.shipment_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references public.shipments(id) on delete set null,
  source_event_id uuid references public.shipment_events(id) on delete set null,
  event_type text not null check (event_type in ('shipment_created', 'status_changed')),
  previous_status public.shipment_status,
  new_status public.shipment_status not null,
  tracking_number text not null,
  recipient_email text,
  recipient_name text,
  sender_name text,
  parcel_description text,
  origin_city text,
  origin_country text,
  destination_city text,
  destination_country text,
  shipment_created_at timestamptz not null,
  event_at timestamptz not null,
  estimated_delivery_at timestamptz,
  location text,
  event_description text,
  delivery_status text not null default 'queued'
    check (delivery_status in ('queued', 'processing', 'sent', 'failed', 'permanently_failed')),
  provider_status text
    check (provider_status is null or provider_status in ('accepted', 'delivered', 'bounced', 'complained')),
  test_mode boolean not null default false,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  attempts_in_cycle integer not null default 0 check (attempts_in_cycle >= 0),
  provider_message_id text,
  error_message text,
  last_attempt_at timestamptz,
  next_retry_at timestamptz default now(),
  locked_until timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index shipment_notification_source_event_uidx
  on public.shipment_notification_outbox (source_event_id)
  where source_event_id is not null;
create index shipment_notification_due_idx
  on public.shipment_notification_outbox (next_retry_at, created_at)
  where delivery_status in ('queued', 'failed', 'processing');
create index shipment_notification_shipment_idx
  on public.shipment_notification_outbox (shipment_id, created_at desc);
create index shipment_notification_status_idx
  on public.shipment_notification_outbox (delivery_status, created_at desc);

insert into public.status_transitions (from_status, to_status)
select current_status, special_status
from (
  select current_status
  from unnest(enum_range(null::public.shipment_status)) as statuses(current_status)
) statuses
cross join (values ('delayed'::public.shipment_status), ('cancelled'::public.shipment_status)) special(special_status)
where current_status not in ('delivered', 'returned_to_sender', 'delayed', 'cancelled');

insert into public.status_transitions (from_status, to_status)
select 'delayed', next_status
from unnest(enum_range(null::public.shipment_status)) as statuses(next_status)
where next_status not in ('shipment_registered', 'pickup_scheduled', 'delayed');

alter table public.shipment_notification_outbox enable row level security;
revoke all on public.shipment_notification_outbox from anon, authenticated;
grant select on public.shipment_notification_outbox to authenticated;
grant all on public.shipment_notification_outbox to service_role;

create policy "Managers view shipment notifications"
  on public.shipment_notification_outbox for select to authenticated
  using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));

create or replace function public.capture_shipment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_event public.shipment_events;
  v_event_type text;
  v_previous_status public.shipment_status;
  v_event_at timestamptz;
begin
  if new.is_demo then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_event_type := 'shipment_created';
    v_previous_status := null;
    v_event_at := new.created_at;
  else
    v_event_type := 'status_changed';
    v_previous_status := old.status;
    v_event_at := coalesce(new.last_event_at, new.updated_at);
    select * into v_source_event
    from public.shipment_events
    where shipment_id = new.id
      and status = new.status
      and occurred_at = new.last_event_at
      and kind in ('verified', 'customs')
    order by created_at desc
    limit 1;
  end if;

  insert into public.shipment_notification_outbox (
    shipment_id, source_event_id, event_type, previous_status, new_status,
    tracking_number, recipient_email, recipient_name, sender_name, parcel_description,
    origin_city, origin_country, destination_city, destination_country,
    shipment_created_at, event_at, estimated_delivery_at, location, event_description
  ) values (
    new.id, v_source_event.id, v_event_type, v_previous_status, new.status,
    new.tracking_number, nullif(btrim(new.recipient_email), ''), new.recipient_name,
    new.sender_name, new.parcel_description, new.origin_city, new.origin_country,
    new.destination_city, new.destination_country, new.created_at, v_event_at,
    new.estimated_delivery_at, v_source_event.location,
    case
      when v_event_type = 'shipment_created' then 'Shipment registered in RemitShip system'
      else v_source_event.description
    end
  )
  on conflict (source_event_id) where source_event_id is not null do nothing;

  return new;
end;
$$;

revoke all on function public.capture_shipment_notification() from public, anon, authenticated;
create trigger trg_capture_shipment_notification
  after insert or update on public.shipments
  for each row execute function public.capture_shipment_notification();

create or replace function public.claim_shipment_notifications(
  p_batch_size integer default 20,
  p_lease_seconds integer default 180
)
returns setof public.shipment_notification_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required';
  end if;

  return query
  with due as (
    select id
    from public.shipment_notification_outbox
    where (
      (delivery_status in ('queued', 'failed') and next_retry_at <= now())
      or (delivery_status = 'processing' and locked_until <= now())
    )
    order by created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_batch_size, 20), 100))
  )
  update public.shipment_notification_outbox n
  set delivery_status = 'processing',
      attempt_count = n.attempt_count + 1,
      attempts_in_cycle = n.attempts_in_cycle + 1,
      last_attempt_at = now(),
      locked_until = now() + make_interval(secs => greatest(30, least(coalesce(p_lease_seconds, 180), 900))),
      updated_at = now()
  from due
  where n.id = due.id
  returning n.*;
end;
$$;

revoke all on function public.claim_shipment_notifications(integer, integer) from public, anon, authenticated;
grant execute on function public.claim_shipment_notifications(integer, integer) to service_role;

create or replace function public.request_shipment_notification_retry(p_notification_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
begin
  if auth.uid() is null or not (
    public.has_role(auth.uid(), 'super_admin')
    or public.has_role(auth.uid(), 'operations_manager')
  ) then
    raise exception 'Manager access required';
  end if;

  update public.shipment_notification_outbox n
  set recipient_email = nullif(btrim(s.recipient_email), ''),
      recipient_name = s.recipient_name,
      delivery_status = 'queued',
      attempts_in_cycle = 0,
      error_message = null,
      provider_message_id = null,
      provider_status = null,
      test_mode = false,
      last_attempt_at = null,
      next_retry_at = now(),
      locked_until = null,
      updated_at = now()
  from public.shipments s
  where n.id = p_notification_id
    and n.shipment_id = s.id
    and n.delivery_status in ('failed', 'permanently_failed')
  returning n.id into v_notification_id;

  if v_notification_id is null then
    raise exception 'Notification is not eligible for retry';
  end if;

  return v_notification_id;
end;
$$;

revoke all on function public.request_shipment_notification_retry(uuid) from public, anon;
grant execute on function public.request_shipment_notification_retry(uuid) to authenticated;

create table public.shipment_notification_webhook_events (
  provider_event_id text primary key,
  event_type text not null,
  provider_message_id text not null,
  notification_id uuid not null references public.shipment_notification_outbox(id) on delete cascade,
  applied_at timestamptz,
  received_at timestamptz not null default now()
);
alter table public.shipment_notification_webhook_events enable row level security;
revoke all on public.shipment_notification_webhook_events from anon, authenticated;
grant all on public.shipment_notification_webhook_events to service_role;

create or replace function public.record_resend_notification_webhook(
  p_provider_event_id text,
  p_event_type text,
  p_provider_message_id text,
  p_notification_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider_status text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required';
  end if;
  if p_event_type not in ('email.delivered', 'email.bounced', 'email.complained') then
    raise exception 'Unsupported Resend event type';
  end if;
  if not exists (
    select 1 from public.shipment_notification_outbox
    where id = p_notification_id
  ) then
    return false;
  end if;

  insert into public.shipment_notification_webhook_events (
    provider_event_id, event_type, provider_message_id, notification_id
  ) values (
    p_provider_event_id, p_event_type, p_provider_message_id, p_notification_id
  )
  on conflict (provider_event_id) do nothing;
  if not found then
    return false;
  end if;

  v_provider_status := case p_event_type
    when 'email.delivered' then 'delivered'
    when 'email.bounced' then 'bounced'
    else 'complained'
  end;

  update public.shipment_notification_outbox
  set provider_status = v_provider_status,
      updated_at = now()
  where id = p_notification_id
    and provider_message_id = p_provider_message_id;

  update public.shipment_notification_webhook_events
  set applied_at = now()
  where provider_event_id = p_provider_event_id
    and exists (
      select 1 from public.shipment_notification_outbox
      where id = p_notification_id and provider_message_id = p_provider_message_id
    );

  return true;
end;
$$;

create or replace function public.apply_pending_shipment_notification_webhooks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.provider_message_id is null then
    return new;
  end if;

  update public.shipment_notification_outbox n
  set provider_status = case e.event_type
        when 'email.delivered' then 'delivered'
        when 'email.bounced' then 'bounced'
        else 'complained'
      end,
      updated_at = now()
  from public.shipment_notification_webhook_events e
  where n.id = new.id
    and e.notification_id = n.id
    and e.provider_message_id = new.provider_message_id
    and e.applied_at is null;

  update public.shipment_notification_webhook_events
  set applied_at = now()
  where notification_id = new.id
    and provider_message_id = new.provider_message_id
    and applied_at is null;

  return new;
end;
$$;

create trigger trg_apply_pending_shipment_notification_webhooks
  after update of provider_message_id on public.shipment_notification_outbox
  for each row execute function public.apply_pending_shipment_notification_webhooks();

revoke all on function public.apply_pending_shipment_notification_webhooks() from public, anon, authenticated;
revoke all on function public.record_resend_notification_webhook(text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_resend_notification_webhook(text, text, text, uuid) to service_role;

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;

select cron.schedule(
  'process-shipment-notification-outbox',
  '* * * * *',
  $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/process-shipment-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $cron$
);