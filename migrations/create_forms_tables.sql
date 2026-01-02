-- ============================================================================
-- Migration: Create generic forms + form_events tables
-- Purpose: Replace KYC-specific tables with a reusable, form-agnostic schema
-- Forms table stores any form type (kyc, trade_ticket, investor_profile, etc.)
-- form_events tracks immutable history of actions on a form record
-- ============================================================================

-- Generic forms table
create table if not exists public.forms (
  id uuid primary key default extensions.uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  form_type text not null,                           -- e.g., 'kyc', 'trade_ticket', 'investor_profile'
  form_template_id uuid references form_templates(id) on delete set null,
  version integer not null default 1,                -- bump when template/schema changes
  status text not null default 'draft',              -- draft/submitted/approved/etc.
  data jsonb not null default '{}'::jsonb,           -- full form payload
  pdf_url text null,                                 -- optional: template used or generated pdf location
  created_by uuid null,                              -- agent/user who created the record
  submitted_by uuid null,                            -- agent/user who submitted
  submitted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
) TABLESPACE pg_default;

-- Maintain updated_at
create or replace function public.update_forms_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_forms_updated_at
  before update on public.forms
  for each row execute function public.update_forms_updated_at();

-- Indexes for common access patterns
create index if not exists idx_forms_client on public.forms (client_id);
create index if not exists idx_forms_type on public.forms (form_type);
create index if not exists idx_forms_status on public.forms (status);
create index if not exists idx_forms_created on public.forms (created_at desc);
create index if not exists idx_forms_client_type_created on public.forms (client_id, form_type, created_at desc);
create index if not exists idx_forms_data_gin on public.forms using gin (data);

comment on table public.forms is 'Form-agnostic storage for any form submission; use form_type to differentiate.';
comment on column public.forms.data is 'JSONB payload of the submitted form, including arrays and dynamic fields.';

-- Immutable event log for forms
create table if not exists public.form_events (
  id bigserial primary key,
  form_id uuid not null references public.forms(id) on delete cascade,
  event_type text not null,          -- created/updated/submitted/approved/pdf_generated/etc.
  actor_id uuid null,                -- who performed the action
  payload jsonb null default '{}'::jsonb, -- optional context/diff
  created_at timestamptz not null default now()
) TABLESPACE pg_default;

create index if not exists idx_form_events_form on public.form_events (form_id);
create index if not exists idx_form_events_created on public.form_events (created_at desc);
create index if not exists idx_form_events_payload_gin on public.form_events using gin (payload);

comment on table public.form_events is 'Immutable audit log of actions/events related to a form record.';
comment on column public.form_events.payload is 'Optional JSONB payload describing the event context or diff.';

-- Optional: mark older KYC-specific tables as deprecated (kept for backfill/reference)
comment on table public.kyc_collected_info is 'DEPRECATED: replaced by generic forms table.';
comment on table public.kyc_form_pdf is 'DEPRECATED: use forms (data) + storage metadata instead.';
