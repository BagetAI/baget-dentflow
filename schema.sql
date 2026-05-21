-- Dentflow Relational Database Schema Design
-- Target: PostgreSQL (compatible with Supabase, Neon, or RDS)
-- Optimized for 1-4 chair dental practices with sub-20ms queries

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CLINICS TABLE (Multi-tenant isolation)
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL, -- Twilio/A2P sender number
    email VARCHAR(255) NOT NULL UNIQUE,
    timezone VARCHAR(50) DEFAULT 'America/New_York' NOT NULL,
    stripe_subscription_id VARCHAR(255) NULL,
    subscription_status VARCHAR(50) DEFAULT 'trialing' NOT NULL, -- trialing, active, past_due, canceled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_clinics_stripe_status ON clinics(subscription_status) WHERE deleted_at IS NULL;

-- 2. OPERATORIES / CHAIRS TABLE
CREATE TABLE chairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., "Chair 1 (Dr. Reynolds)", "Chair 2 (Hygiene)"
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_chairs_clinic ON chairs(clinic_id) WHERE deleted_at IS NULL;

-- 3. PATIENTS TABLE
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL, -- Formatted to E.164
    email VARCHAR(255) NULL,
    birth_date DATE NOT NULL,
    last_hygiene_date DATE NULL,
    recall_interval_months INTEGER DEFAULT 6 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE UNIQUE INDEX idx_patients_clinic_phone ON patients(clinic_id, phone_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_search ON patients USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- 4. APPOINTMENT SLOTS & BOOKINGS
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE RESTRICT NOT NULL,
    chair_id UUID REFERENCES chairs(id) ON DELETE RESTRICT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' NOT NULL, -- scheduled, confirmed, checked_in, completed, no_show, cancelled
    treatment_notes TEXT NULL,
    insurance_pre_auth_status VARCHAR(50) DEFAULT 'not_required' NOT NULL, -- not_required, submitted, approved, denied
    insurance_pre_auth_id VARCHAR(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT chk_times CHECK (start_time < end_time)
);

CREATE INDEX idx_appointments_clinic_time ON appointments(clinic_id, start_time, end_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_patient ON appointments(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_pre_auth ON appointments(insurance_pre_auth_status) WHERE insurance_pre_auth_status IN ('submitted');

-- 5. NOTIFICATION TRIGGERS & CAMPAIGNS
-- Manages automated reminder cadence and hygiene recall triggers
CREATE TABLE notification_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    trigger_type VARCHAR(100) NOT NULL, -- e.g., '72h_reminder', '24h_reminder', '6m_recall', 'pre_auth_approved'
    timing_interval_hours INTEGER NOT NULL, -- hours before start_time or after trigger
    message_template TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_notification_rules_clinic ON notification_rules(clinic_id, trigger_type);

-- 6. NOTIFICATION LOGS (Twilio status monitoring and TCPA audit trails)
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE RESTRICT NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    rule_id UUID REFERENCES notification_rules(id) ON DELETE SET NULL,
    message_type VARCHAR(50) DEFAULT 'sms' NOT NULL, -- sms, email
    recipient_phone VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'queued' NOT NULL, -- queued, sent, delivered, failed, received_reply
    twilio_sid VARCHAR(100) NULL, -- Reference to external carrier API ID
    error_message TEXT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_appointment ON notification_logs(appointment_id);
CREATE INDEX idx_notification_logs_twilio_sid ON notification_logs(twilio_sid) WHERE twilio_sid IS NOT NULL;
