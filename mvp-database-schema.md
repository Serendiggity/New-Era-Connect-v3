# MVP Database Schema

## Core Tables

### events
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(255),
  industry VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### contacts
```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  title VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url VARCHAR(255),
  
  -- OCR related
  business_card_url TEXT, -- Supabase Storage URL
  ocr_confidence DECIMAL(3,2), -- 0.00 to 1.00
  ocr_raw_data JSONB, -- Store complete OCR response
  
  -- Processing tracking
  status VARCHAR(20) DEFAULT 'processing', -- processing, completed, failed, pending_review, user_verified
  processed_at TIMESTAMP, -- When OCR completed
  reviewed_at TIMESTAMP, -- When user reviewed (if needed)
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contacts_event_id ON contacts(event_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_processed_at ON contacts(processed_at);
```

### ocr_jobs
```sql
-- Future-proofing for background OCR processing
CREATE TABLE ocr_jobs (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ocr_jobs_status ON ocr_jobs(status);
CREATE INDEX idx_ocr_jobs_contact_id ON ocr_jobs(contact_id);
```

### lead_groups
```sql
CREATE TABLE lead_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### lead_group_contacts
```sql
CREATE TABLE lead_group_contacts (
  lead_group_id INTEGER REFERENCES lead_groups(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (lead_group_id, contact_id)
);
```

### email_templates
```sql
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[], -- ['firstName', 'company', 'eventName']
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### email_campaigns
```sql
CREATE TABLE email_campaigns (
  id SERIAL PRIMARY KEY,
  lead_group_id INTEGER REFERENCES lead_groups(id),
  template_id INTEGER REFERENCES email_templates(id),
  name VARCHAR(255) NOT NULL, -- User-friendly campaign name
  status VARCHAR(50) DEFAULT 'draft', -- draft, generating, ready, exported
  generated_at TIMESTAMP, -- When AI drafts were generated
  exported_at TIMESTAMP, -- When CSV was exported
  export_count INTEGER DEFAULT 0, -- Track how many times exported
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_generated_at ON email_campaigns(generated_at);
```

### email_drafts
```sql
CREATE TABLE email_drafts (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id),
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  personalization_data JSONB, -- Store AI reasoning/context
  
  -- Export tracking
  exported_at TIMESTAMP, -- When included in CSV export
  sent_at TIMESTAMP, -- When actually sent (future Gmail integration)
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_drafts_campaign_id ON email_drafts(campaign_id);
CREATE INDEX idx_email_drafts_exported_at ON email_drafts(exported_at);
```

### activity_logs
```sql
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL, -- Standardized action types (see below)
  entity_type VARCHAR(50), -- contact, event, email_campaign, lead_group
  entity_id INTEGER,
  metadata JSONB, -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
```

## Standardized Activity Log Actions

Document the specific actions to track for consistent analytics:

- **Contact Actions**: `contact_uploaded`, `contact_processed`, `contact_reviewed`, `contact_verified`
- **Event Actions**: `event_created`, `event_updated`, `event_deleted`
- **Lead Group Actions**: `lead_group_created`, `contacts_added_to_group`, `contacts_removed_from_group`
- **Email Actions**: `email_campaign_created`, `email_drafts_generated`, `email_campaign_exported`

## Key Design Decisions

1. **Single-User System**: No user table needed, everything belongs to implied user_id: 1
2. **Consistent Field Naming**: Use `status` consistently (not `processing_status`)
3. **Comprehensive Tracking**: Added timestamps for all major workflow milestones
4. **Future-Proof OCR**: `ocr_jobs` table ready for background processing
5. **Export Analytics**: Track when and how often campaigns are exported
6. **JSONB for Flexibility**: Store OCR raw data and AI personalization context
7. **Optimized Indexes**: Focus on common query patterns and dashboard needs

## Dashboard Analytics Queries

With these schema updates, you can build:

```sql
-- Total contacts by status
SELECT status, COUNT(*) FROM contacts GROUP BY status;

-- Processing time metrics
SELECT AVG(processed_at - created_at) as avg_processing_time 
FROM contacts WHERE processed_at IS NOT NULL;

-- Time from upload to email generation
SELECT AVG(ec.generated_at - c.created_at) as upload_to_email_time
FROM contacts c
JOIN lead_group_contacts lgc ON c.id = lgc.contact_id
JOIN email_campaigns ec ON lgc.lead_group_id = ec.lead_group_id
WHERE ec.generated_at IS NOT NULL;

-- Contacts needing review
SELECT COUNT(*) FROM contacts WHERE status = 'pending_review';
```

## Future Migration Path

When adding multi-tenancy later:
1. Add `users` and `organizations` tables
2. Add `user_id` to all entity tables
3. Add `org_id` for true multi-tenancy
4. Migrate existing data to default org/user
5. Update all queries to include user/org filtering