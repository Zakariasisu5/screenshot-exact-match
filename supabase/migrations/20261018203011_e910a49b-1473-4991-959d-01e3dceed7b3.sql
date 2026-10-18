-- ============ RemitShip schema ============

-- Enums
create type public.staff_role as enum ('super_admin', 'operations_manager', 'courier');

create type public.shipment_status as enum (
  'shipment_registered', 'pickup_scheduled', 'collected', 'at_origin_facility',
  'ready_for_dispatch', 'in_transit', 'arrived_in_destination_country',
  'customs_clearance', 'customs_hold', 'at_destination_facility',
  'out_for_delivery', 'delivery_attempted', 'delivered', 'exception', 'returned_to_sender'
);

create type public.event_kind as enum ('verified', 'estimate', 'customs', 'internal');

-- Staff profiles (one row per auth user, created by trigger)
create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles (separate table; never on profiles)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.staff_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Couriers (carrier teams; may or may not have a login)
create table public.couriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  contact_email text,
  contact_phone text,
  staff_profile_id uuid references public.staff_profiles(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  courier_id uuid not null references public.couriers(id) on delete cascade,
  plate text not null unique,
  vehicle_type text,
  status text not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  country text not null,
  city text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Shipments (tracking number is permanent and unique)
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_number text not null unique,
  status public.shipment_status not null default 'shipment_registered',
  service_type text not null default 'standard',
  sender_name text not null,
  sender_company text,
  sender_phone text,
  sender_email text,
  recipient_name text not null,
  recipient_company text,
  recipient_phone text,
  recipient_email text,
  origin_country text not null,
  origin_city text not null,
  destination_country text not null,
  destination_city text not null,
  pieces integer not null default 1,
  weight_kg numeric(10,2),
  length_cm numeric(8,2),
  width_cm numeric(8,2),
  height_cm numeric(8,2),
  parcel_description text,
  declared_value numeric(12,2),
  currency text not null default 'USD',
  assigned_courier_id uuid references public.couriers(id) on delete set null,
  assigned_vehicle_id uuid references public.vehicles(id) on delete set null,
  estimated_delivery_at timestamptz,
  customs_status text,
  notes_internal text,
  is_demo boolean not null default false,
  created_by uuid references public.staff_profiles(id) on delete set null,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipment_legs (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  leg_sequence integer not null,
  origin_facility_id uuid references public.facilities(id) on delete set null,
  destination_facility_id uuid references public.facilities(id) on delete set null,
  transport_mode text not null default 'road',
  status text not null default 'planned',
  departed_at timestamptz,
  arrived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status public.shipment_status,
  location text,
  country text,
  description text not null,
  kind public.event_kind not null default 'verified',
  latitude numeric(9,6),
  longitude numeric(9,6),
  occurred_at timestamptz not null,
  recorded_by uuid references public.staff_profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.customs_records (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null,
  hold_reason text,
  cleared_at timestamptz,
  notes text,
  recorded_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.proof_of_delivery (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  delivered_at timestamptz not null,
  received_by_name text,
  signature_url text,
  photo_url text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  notes text,
  recorded_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  action text not null,
  changed_by uuid references public.staff_profiles(id) on delete set null,
  reason text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index shipment_events_shipment_idx on public.shipment_events (shipment_id, occurred_at desc);
create index shipments_status_idx on public.shipments (status);
create index shipments_demo_idx on public.shipments (is_demo);

-- ============ Grants ============
grant select, insert, update, delete on public.staff_profiles to authenticated;
grant all on public.staff_profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
grant select, insert, update, delete on public.couriers to authenticated;
grant all on public.couriers to service_role;
grant select, insert, update, delete on public.vehicles to authenticated;
grant all on public.vehicles to service_role;
grant select, insert, update, delete on public.facilities to authenticated;
grant all on public.facilities to service_role;
grant select, insert, update, delete on public.shipments to authenticated;
grant all on public.shipments to service_role;
grant select, insert, update, delete on public.shipment_legs to authenticated;
grant all on public.shipment_legs to service_role;
grant select, insert, update, delete on public.shipment_events to authenticated;
grant all on public.shipment_events to service_role;
grant select, insert, update, delete on public.customs_records to authenticated;
grant all on public.customs_records to service_role;
grant select, insert, update, delete on public.proof_of_delivery to authenticated;
grant all on public.proof_of_delivery to service_role;
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;

-- ============ RLS ============
alter table public.staff_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.couriers enable row level security;
alter table public.vehicles enable row level security;
alter table public.facilities enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_legs enable row level security;
alter table public.shipment_events enable row level security;
alter table public.customs_records enable row level security;
alter table public.proof_of_delivery enable row level security;
alter table public.audit_logs enable row level security;

-- Role helper (security definer avoids recursive policy checks)
create or replace function public.has_role(_user_id uuid, _role public.staff_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

revoke execute on function public.has_role(uuid, public.staff_role) from anon, public;
grant execute on function public.has_role(uuid, public.staff_role) to authenticated;

-- First user to claim becomes Super Admin (bootstrap; no-ops once one exists)
create or replace function public.bootstrap_first_super_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n int; r int;
begin
  select count(*) into n from public.user_roles where role = 'super_admin';
  select count(*) into r from public.user_roles where user_id = p_user_id;
  if n = 0 and r = 0 then
    insert into public.user_roles (user_id, role) values (p_user_id, 'super_admin');
  end if;
end;
$$;

revoke execute on function public.bootstrap_first_super_admin(uuid) from anon, public;
grant execute on function public.bootstrap_first_super_admin(uuid) to authenticated;

-- staff_profiles policies
create policy "Staff can view own profile" on public.staff_profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Super admins insert profiles" on public.staff_profiles for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin'));
create policy "Staff update own profile" on public.staff_profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'super_admin')) with check (id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins delete profiles" on public.staff_profiles for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

-- user_roles policies
create policy "Staff view own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins manage roles" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins update roles" on public.user_roles for update to authenticated using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins delete roles" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

-- couriers / vehicles / facilities (staff-managed reference data)
create policy "Staff view couriers" on public.couriers for select to authenticated using (true);
create policy "Managers manage couriers" on public.couriers for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Managers update couriers" on public.couriers for update to authenticated using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager')) with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Super admins delete couriers" on public.couriers for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

create policy "Staff view vehicles" on public.vehicles for select to authenticated using (true);
create policy "Managers manage vehicles" on public.vehicles for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Managers update vehicles" on public.vehicles for update to authenticated using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager')) with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Super admins delete vehicles" on public.vehicles for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

create policy "Staff view facilities" on public.facilities for select to authenticated using (true);
create policy "Managers manage facilities" on public.facilities for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Managers update facilities" on public.facilities for update to authenticated using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager')) with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Super admins delete facilities" on public.facilities for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

-- shipments: managers see all; couriers only assigned shipments
create policy "Staff view shipments" on public.shipments for select to authenticated using (
  public.has_role(auth.uid(), 'super_admin')
  or public.has_role(auth.uid(), 'operations_manager')
  or exists (select 1 from public.couriers c where c.staff_profile_id = auth.uid() and c.id = shipments.assigned_courier_id)
);
create policy "Managers create shipments" on public.shipments for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Managers update shipments" on public.shipments for update to authenticated using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager')) with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Super admins delete shipments" on public.shipments for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

-- legs
create policy "Staff view legs" on public.shipment_legs for select to authenticated using (
  public.has_role(auth.uid(), 'super_admin')
  or public.has_role(auth.uid(), 'operations_manager')
  or exists (select 1 from public.shipments s join public.couriers c on c.id = s.assigned_courier_id where s.id = shipment_legs.shipment_id and c.staff_profile_id = auth.uid())
);
create policy "Managers manage legs" on public.shipment_legs for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Managers update legs" on public.shipment_legs for update to authenticated using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager')) with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Super admins delete legs" on public.shipment_legs for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

-- events: managers read all; couriers read assigned; status changes go through record_shipment_event
create policy "Staff view events" on public.shipment_events for select to authenticated using (
  public.has_role(auth.uid(), 'super_admin')
  or public.has_role(auth.uid(), 'operations_manager')
  or exists (select 1 from public.shipments s join public.couriers c on c.id = s.assigned_courier_id where s.id = shipment_events.shipment_id and c.staff_profile_id = auth.uid())
);
create policy "Managers add events" on public.shipment_events for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Super admins correct events" on public.shipment_events for update to authenticated using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins delete events" on public.shipment_events for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

-- customs
create policy "Staff view customs" on public.customs_records for select to authenticated using (
  public.has_role(auth.uid(), 'super_admin')
  or public.has_role(auth.uid(), 'operations_manager')
  or exists (select 1 from public.shipments s join public.couriers c on c.id = s.assigned_courier_id where s.id = customs_records.shipment_id and c.staff_profile_id = auth.uid())
);
create policy "Managers manage customs" on public.customs_records for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Managers update customs" on public.customs_records for update to authenticated using (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager')) with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager'));
create policy "Super admins delete customs" on public.customs_records for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

-- proof of delivery
create policy "Staff view POD" on public.proof_of_delivery for select to authenticated using (
  public.has_role(auth.uid(), 'super_admin')
  or public.has_role(auth.uid(), 'operations_manager')
  or exists (select 1 from public.shipments s join public.couriers c on c.id = s.assigned_courier_id where s.id = proof_of_delivery.shipment_id and c.staff_profile_id = auth.uid())
);
create policy "Managers record POD" on public.proof_of_delivery for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager') or exists (select 1 from public.shipments s join public.couriers c on c.id = s.assigned_courier_id where s.id = proof_of_delivery.shipment_id and c.staff_profile_id = auth.uid()));
create policy "Super admins update POD" on public.proof_of_delivery for update to authenticated using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));
create policy "Super admins delete POD" on public.proof_of_delivery for delete to authenticated using (public.has_role(auth.uid(), 'super_admin'));

-- audit logs: append-only for staff, read by super admins
create policy "Staff append audit logs" on public.audit_logs for insert to authenticated with check (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'operations_manager') or public.has_role(auth.uid(), 'courier'));
create policy "Super admins view audit logs" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(), 'super_admin'));

-- ============ Tracking number generator ============
create or replace function public.generate_tracking_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'RS' || to_char(now(), 'YY') || lpad((floor(random() * 1000000))::int::text, 6, '0');
    if not exists (select 1 from public.shipments where tracking_number = candidate) then
      return candidate;
    end if;
  end loop;
end;
$$;

revoke execute on function public.generate_tracking_number() from anon, public;
grant execute on function public.generate_tracking_number() to authenticated;

-- ============ Status transition rules ============
create table public.status_transitions (
  from_status public.shipment_status not null,
  to_status public.shipment_status not null,
  primary key (from_status, to_status)
);
grant select on public.status_transitions to authenticated;
grant all on public.status_transitions to service_role;
alter table public.status_transitions enable row level security;
create policy "Staff view transitions" on public.status_transitions for select to authenticated using (true);

insert into public.status_transitions (from_status, to_status) values
  ('shipment_registered', 'pickup_scheduled'),
  ('shipment_registered', 'exception'),
  ('shipment_registered', 'returned_to_sender'),
  ('pickup_scheduled', 'collected'),
  ('pickup_scheduled', 'exception'),
  ('pickup_scheduled', 'returned_to_sender'),
  ('collected', 'at_origin_facility'),
  ('collected', 'exception'),
  ('collected', 'returned_to_sender'),
  ('at_origin_facility', 'ready_for_dispatch'),
  ('at_origin_facility', 'in_transit'),
  ('at_origin_facility', 'exception'),
  ('ready_for_dispatch', 'in_transit'),
  ('ready_for_dispatch', 'exception'),
  ('in_transit', 'arrived_in_destination_country'),
  ('in_transit', 'at_destination_facility'),
  ('in_transit', 'exception'),
  ('in_transit', 'returned_to_sender'),
  ('arrived_in_destination_country', 'customs_clearance'),
  ('arrived_in_destination_country', 'at_destination_facility'),
  ('arrived_in_destination_country', 'exception'),
  ('customs_clearance', 'customs_hold'),
  ('customs_clearance', 'at_destination_facility'),
  ('customs_clearance', 'exception'),
  ('customs_hold', 'customs_clearance'),
  ('customs_hold', 'exception'),
  ('customs_hold', 'returned_to_sender'),
  ('at_destination_facility', 'out_for_delivery'),
  ('at_destination_facility', 'in_transit'),
  ('at_destination_facility', 'exception'),
  ('at_destination_facility', 'returned_to_sender'),
  ('out_for_delivery', 'delivery_attempted'),
  ('out_for_delivery', 'delivered'),
  ('out_for_delivery', 'exception'),
  ('out_for_delivery', 'returned_to_sender'),
  ('delivery_attempted', 'out_for_delivery'),
  ('delivery_attempted', 'at_destination_facility'),
  ('delivery_attempted', 'returned_to_sender'),
  ('delivery_attempted', 'exception'),
  ('delivered', 'returned_to_sender'),
  ('exception', 'pickup_scheduled'),
  ('exception', 'at_origin_facility'),
  ('exception', 'in_transit'),
  ('exception', 'at_destination_facility'),
  ('exception', 'customs_clearance'),
  ('exception', 'out_for_delivery'),
  ('exception', 'returned_to_sender');

-- ============ Privileged event recording (validates transitions, audits every change) ============
create or replace function public.record_shipment_event(
  p_shipment_id uuid,
  p_status public.shipment_status,
  p_location text default null,
  p_country text default null,
  p_description text default null,
  p_kind public.event_kind default 'verified',
  p_occurred_at timestamptz default now(),
  p_reason text default null,
  p_latitude numeric default null,
  p_longitude numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shipment public.shipments;
  v_caller uuid := auth.uid();
  v_is_manager boolean;
  v_is_courier_assigned boolean;
  v_event_id uuid;
begin
  if v_caller is null then
    raise exception 'Unauthorized';
  end if;

  select * into v_shipment from public.shipments where id = p_shipment_id;
  if v_shipment is null then
    raise exception 'Shipment not found';
  end if;

  v_is_manager := public.has_role(v_caller, 'super_admin') or public.has_role(v_caller, 'operations_manager');
  v_is_courier_assigned := exists (
    select 1 from public.couriers c
    where c.staff_profile_id = v_caller and c.id = v_shipment.assigned_courier_id
  );

  if not v_is_manager and not v_is_courier_assigned then
    raise exception 'Forbidden: not authorized for this shipment';
  end if;

  -- Couriers may only submit authorized delivery events on their own shipments
  if v_is_courier_assigned and not v_is_manager then
    if p_status not in ('out_for_delivery', 'delivery_attempted', 'delivered')
       or p_kind not in ('verified') then
      raise exception 'Couriers may only submit delivery events';
    end if;
  end if;

  -- Validate the status transition
  if p_status is distinct from v_shipment.status then
    if not exists (
      select 1 from public.status_transitions
      where from_status = v_shipment.status and to_status = p_status
    ) then
      raise exception 'Invalid status transition: % -> %', v_shipment.status, p_status;
    end if;
  end if;

  -- Never mark delivered without an authorized delivery confirmation
  if p_status = 'delivered' and not exists (
    select 1 from public.proof_of_delivery where shipment_id = p_shipment_id
  ) then
    raise exception 'Proof of delivery is required before marking delivered';
  end if;

  insert into public.shipment_events (
    shipment_id, status, location, country, description, kind,
    latitude, longitude, occurred_at, recorded_by, reason
  ) values (
    p_shipment_id, p_status, p_location, p_country,
    coalesce(p_description, 'Status updated to ' || p_status::text),
    p_kind, p_latitude, p_longitude, p_occurred_at, v_caller, p_reason
  ) returning id into v_event_id;

  update public.shipments
    set status = p_status,
        last_event_at = p_occurred_at,
        updated_at = now()
  where id = p_shipment_id;

  insert into public.audit_logs (table_name, record_id, action, changed_by, reason, details)
  values (
    'shipments', p_shipment_id, 'status_change:' || p_status::text, v_caller, p_reason,
    jsonb_build_object('event_id', v_event_id, 'kind', p_kind::text, 'from', v_shipment.status::text, 'to', p_status::text)
  );

  return v_event_id;
end;
$$;

revoke execute on function public.record_shipment_event(uuid, public.shipment_status, text, text, text, public.event_kind, timestamptz, text, numeric, numeric) from anon, public;
grant execute on function public.record_shipment_event(uuid, public.shipment_status, text, text, text, public.event_kind, timestamptz, text, numeric, numeric) to authenticated;

-- ============ updated_at maintenance ============
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_shipments_updated_at before update on public.shipments for each row execute function public.set_updated_at();
create trigger trg_couriers_updated_at before update on public.couriers for each row execute function public.set_updated_at();
create trigger trg_vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();
create trigger trg_facilities_updated_at before update on public.facilities for each row execute function public.set_updated_at();
create trigger trg_legs_updated_at before update on public.shipment_legs for each row execute function public.set_updated_at();
create trigger trg_customs_updated_at before update on public.customs_records for each row execute function public.set_updated_at();

-- ============ Staff profile auto-creation on signup ============
create or replace function public.handle_new_staff_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.staff_profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_staff_user();

-- ============ Public tracking views (approved fields only) ============
create or replace view public.public_tracking_shipments as
select
  id, tracking_number, status::text as status, service_type,
  origin_city, origin_country, destination_city, destination_country,
  pieces, estimated_delivery_at, customs_status, last_event_at, created_at, is_demo
from public.shipments;

create or replace view public.public_tracking_events as
select
  e.id, e.shipment_id, e.status::text as status, e.location, e.country,
  e.description, e.kind::text as kind, e.occurred_at
from public.shipment_events e
where e.kind in ('verified', 'estimate', 'customs');

grant select on public.public_tracking_shipments to anon, authenticated;
grant select on public.public_tracking_events to anon, authenticated;

-- ============ Demo data (flagged; never mixes with real records) ============
insert into public.facilities (code, name, country, city, latitude, longitude) values
  ('ACC-HUB', 'Accra Gateway Hub', 'GH', 'Accra', 5.603717, -0.186964),
  ('LON-HUB', 'London Gateway Facility', 'GB', 'London', 51.470022, -0.454295),
  ('JFK-HUB', 'New York JFK Import Center', 'US', 'New York', 40.641311, -73.778139),
  ('RTM-HUB', 'Rotterdam Distribution Center', 'NL', 'Rotterdam', 51.924420, 4.477733);

insert into public.couriers (name, code, contact_email, contact_phone) values
  ('Skyline Air Cargo', 'SKY', 'ops@skyline-cargo.example', '+44 20 7946 0100'),
  ('MetroX Courier', 'MTX', 'dispatch@metrox.example', '+233 30 274 0100');

insert into public.vehicles (courier_id, plate, vehicle_type, status)
select id, 'MTX-GH-014', 'Panel van', 'assigned' from public.couriers where code = 'MTX';
insert into public.vehicles (courier_id, plate, vehicle_type, status)
select id, 'MTX-GH-021', 'Cargo bike', 'available' from public.couriers where code = 'MTX';

-- Demo shipment 1: in transit, Accra -> London
insert into public.shipments (
  tracking_number, status, service_type, sender_name, sender_phone, sender_email,
  recipient_name, recipient_phone, recipient_email,
  origin_country, origin_city, destination_country, destination_city,
  pieces, weight_kg, parcel_description, declared_value, currency,
  assigned_courier_id, estimated_delivery_at, is_demo, last_event_at
) values (
  'RS26000101', 'in_transit', 'express', 'Kwame Boateng', '+233 24 000 0101', 'kwame.b@example.com',
  'Amelia Clarke', '+44 20 7946 0101', 'amelia.clarke@example.com',
  'GH', 'Accra', 'GB', 'London', 2, 8.40, 'Documents and laptop', 1250.00, 'USD',
  (select id from public.couriers where code = 'SKY'), now() + interval '2 days', true, now() - interval '2 days'
);

insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'shipment_registered', 'Accra', 'GH', 'Shipment registered in RemitShip system', 'verified', now() - interval '6 days' from public.shipments where tracking_number = 'RS26000101';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'pickup_scheduled', 'Accra', 'GH', 'Pickup scheduled', 'estimate', now() - interval '5 days' from public.shipments where tracking_number = 'RS26000101';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'collected', 'Accra', 'GH', 'Parcel collected from sender', 'verified', now() - interval '5 days' from public.shipments where tracking_number = 'RS26000101';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'at_origin_facility', 'Accra Gateway Hub', 'GH', 'Arrived at origin facility', 'verified', now() - interval '4 days' from public.shipments where tracking_number = 'RS26000101';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, latitude, longitude, occurred_at)
select id, 'in_transit', 'Departed Accra', 'GH', 'Departed origin on flight SK-227', 'verified', 5.603717, -0.186964, now() - interval '2 days' from public.shipments where tracking_number = 'RS26000101';

insert into public.shipment_legs (shipment_id, leg_sequence, origin_facility_id, destination_facility_id, transport_mode, status, departed_at)
select s.id, 1, f1.id, f2.id, 'air', 'in_transit', now() - interval '2 days'
from public.shipments s, public.facilities f1, public.facilities f2
where s.tracking_number = 'RS26000101' and f1.code = 'ACC-HUB' and f2.code = 'LON-HUB';

-- Demo shipment 2: delivered, Accra -> New York (with POD and cleared customs)
insert into public.shipments (
  tracking_number, status, service_type, sender_name, sender_phone,
  recipient_name, recipient_phone, recipient_email,
  origin_country, origin_city, destination_country, destination_city,
  pieces, weight_kg, parcel_description, declared_value, currency,
  assigned_courier_id, estimated_delivery_at, customs_status, is_demo, last_event_at
) values (
  'RS26000102', 'delivered', 'standard', 'Akosua Mensah', '+233 24 000 0102',
  'James Okafor', '+1 212 555 0102', 'james.okafor@example.com',
  'GH', 'Accra', 'US', 'New York', 1, 3.20, 'Handwoven fabric samples', 480.00, 'USD',
  (select id from public.couriers where code = 'SKY'), now() - interval '1 day', 'cleared', true, now() - interval '1 day'
);

insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'shipment_registered', 'Accra', 'GH', 'Shipment registered in RemitShip system', 'verified', now() - interval '10 days' from public.shipments where tracking_number = 'RS26000102';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'pickup_scheduled', 'Accra', 'GH', 'Pickup scheduled', 'estimate', now() - interval '9 days' from public.shipments where tracking_number = 'RS26000102';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'collected', 'Accra', 'GH', 'Parcel collected from sender', 'verified', now() - interval '9 days' from public.shipments where tracking_number = 'RS26000102';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'at_origin_facility', 'Accra Gateway Hub', 'GH', 'Arrived at origin facility', 'verified', now() - interval '8 days' from public.shipments where tracking_number = 'RS26000102';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'ready_for_dispatch', 'Accra Gateway Hub', 'GH', 'Processed and ready for dispatch', 'verified', now() - interval '8 days' from public.shipments where tracking_number = 'RS26000102';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'in_transit', 'Departed Accra', 'GH', 'Departed origin on flight SK-118', 'verified', now() - interval '8 days' from public.shipments where tracking_number = 'RS26000102';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, latitude, longitude, occurred_at)
select id, 'arrived_in_destination_country', 'New York', 'US', 'Arrived in destination country', 'verified', 40.641311, -73.778139, now() - interval '5 days' from public.shipments where tracking_number = 'RS26000102';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'customs_clearance', 'New York JFK Import Center', 'US', 'Customs clearance in progress', 'customs', now() - interval '4 days' from public.shipments where tracking_number = 'RS26000102';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'at_destination_facility', 'New York JFK Import Center', 'US', 'Arrived at destination facility', 'verified', now() - interval '3 days' from public.shipments where tracking_number = 'RS26000102';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'out_for_delivery', 'New York', 'US', 'Out for delivery', 'verified', now() - interval '1 day' from public.shipments where tracking_number = 'RS26000102';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'delivered', 'New York', 'US', 'Delivered — signed for by recipient', 'verified', now() - interval '1 day' from public.shipments where tracking_number = 'RS26000102';

insert into public.shipment_legs (shipment_id, leg_sequence, origin_facility_id, destination_facility_id, transport_mode, status, departed_at, arrived_at)
select s.id, 1, f1.id, f2.id, 'air', 'completed', now() - interval '8 days', now() - interval '5 days'
from public.shipments s, public.facilities f1, public.facilities f2
where s.tracking_number = 'RS26000102' and f1.code = 'ACC-HUB' and f2.code = 'JFK-HUB';

insert into public.shipment_legs (shipment_id, leg_sequence, origin_facility_id, destination_facility_id, transport_mode, status, departed_at, arrived_at)
select s.id, 2, f.id, f.id, 'road', 'completed', now() - interval '3 days', now() - interval '1 day'
from public.shipments s, public.facilities f
where s.tracking_number = 'RS26000102' and f.code = 'JFK-HUB';

insert into public.customs_records (shipment_id, status, cleared_at, recorded_by)
select id, 'cleared', now() - interval '4 days', null from public.shipments where tracking_number = 'RS26000102';

insert into public.proof_of_delivery (shipment_id, delivered_at, received_by_name, latitude, longitude, recorded_by)
select id, now() - interval '1 day', 'James Okafor', 40.712776, -74.005974, null from public.shipments where tracking_number = 'RS26000102';

-- Demo shipment 3: customs hold, Accra -> Rotterdam
insert into public.shipments (
  tracking_number, status, service_type, sender_name, sender_phone,
  recipient_name, recipient_company, recipient_phone,
  origin_country, origin_city, destination_country, destination_city,
  pieces, weight_kg, parcel_description, declared_value, currency,
  assigned_courier_id, estimated_delivery_at, customs_status, is_demo, last_event_at
) values (
  'RS26000103', 'customs_hold', 'standard', 'Yaw Owusu', '+233 24 000 0103',
  'Sanne de Vries', 'Vries Trading BV', '+31 10 555 0103',
  'GH', 'Accra', 'NL', 'Rotterdam', 5, 22.75, 'Shea butter shipment', 3100.00, 'USD',
  (select id from public.couriers where code = 'SKY'), now() + interval '5 days', 'hold', true, now() - interval '1 day'
);

insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'shipment_registered', 'Accra', 'GH', 'Shipment registered in RemitShip system', 'verified', now() - interval '7 days' from public.shipments where tracking_number = 'RS26000103';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'collected', 'Accra', 'GH', 'Parcel collected from sender', 'verified', now() - interval '6 days' from public.shipments where tracking_number = 'RS26000103';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'at_origin_facility', 'Accra Gateway Hub', 'GH', 'Arrived at origin facility', 'verified', now() - interval '6 days' from public.shipments where tracking_number = 'RS26000103';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'in_transit', 'Departed Accra', 'GH', 'Departed origin on flight SK-451', 'verified', now() - interval '5 days' from public.shipments where tracking_number = 'RS26000103';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, latitude, longitude, occurred_at)
select id, 'arrived_in_destination_country', 'Rotterdam', 'NL', 'Arrived in destination country', 'verified', 51.924420, 4.477733, now() - interval '3 days' from public.shipments where tracking_number = 'RS26000103';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'customs_clearance', 'Rotterdam Distribution Center', 'NL', 'Customs clearance in progress', 'customs', now() - interval '2 days' from public.shipments where tracking_number = 'RS26000103';
insert into public.shipment_events (shipment_id, status, location, country, description, kind, occurred_at)
select id, 'customs_hold', 'Rotterdam Distribution Center', 'NL', 'Held by customs for documentation review', 'customs', now() - interval '1 day' from public.shipments where tracking_number = 'RS26000103';

insert into public.customs_records (shipment_id, status, hold_reason, recorded_by)
select id, 'hold', 'Missing commercial invoice details', null from public.shipments where tracking_number = 'RS26000103';
