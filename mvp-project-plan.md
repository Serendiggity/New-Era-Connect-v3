# Business Card Lead Manager - MVP Project Plan

## 🎯 Project Overview

**Goal**: Build a functional MVP that enables users to scan business cards from events, extract contact information via OCR, organize leads into groups, and generate personalized email campaigns with AI.

**Timeline**: 10-14 days to working MVP  
**Approach**: Single-user system, feature-sliced architecture, CSV export for emails

---

## 📊 Success Criteria

- [ ] User can create and manage events
- [ ] Business cards can be uploaded and processed with OCR
- [ ] Low-confidence OCR results can be reviewed and corrected
- [ ] Contacts can be organized into lead groups
- [ ] AI generates personalized emails from templates
- [ ] Email campaigns can be exported as CSV for mail merge
- [ ] Dashboard shows key metrics and activity

---

## 🏗️ Technical Architecture

### Stack
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + TanStack Query
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Storage**: Supabase Storage
- **OCR**: Tesseract.js
- **AI**: OpenAI API
- **Deployment**: Vercel (frontend) + Render (backend)

### Project Structure
```
business-card-manager/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types
└── docs/           # Documentation
```

### Key Implementation Notes
- **Consistent Naming**: Use `status` field consistently across all entities
- **Activity Tracking**: Log all major actions using standardized action names
- **Timestamp Strategy**: Track processing milestones for analytics
- **Single-User**: Hard-code user_id = 1 in all database operations

---

## 📅 Development Phases

### **Phase 1: Foundation Setup** (Days 1-2)
**Goal**: Get the basic infrastructure running

#### Day 1: Project Initialization
- [ ] Create monorepo with pnpm workspaces
- [ ] Set up TypeScript configs
- [ ] Initialize Git repository
- [ ] Create Supabase project
- [ ] Run database migrations (use updated schema)
- [ ] Set up environment variables

**Deliverable**: Empty but properly configured project

#### Day 2: Core Infrastructure
- [ ] Express server with feature-sliced structure
- [ ] React app with routing
- [ ] Shadcn/ui components setup
- [ ] Database connection with Drizzle
- [ ] Activity logging middleware setup
- [ ] Basic error handling
- [ ] Development scripts

**Deliverable**: "Hello World" fullstack app deployed

---

### **Phase 2: Event Management** (Days 3-4)
**Goal**: Complete CRUD for events with activity tracking

#### Day 3: Backend
- [ ] Create events feature slice
- [ ] Implement events.service.ts (CRUD operations)
- [ ] Implement events.routes.ts (REST endpoints)
- [ ] Add validation with Zod
- [ ] Add activity logging for event actions
- [ ] Test with Postman/Thunder Client

#### Day 4: Frontend
- [ ] Events list page
- [ ] Create event modal
- [ ] Event detail page
- [ ] TanStack Query integration
- [ ] Loading and error states

**Deliverable**: Fully functional event management with activity logs

---

### **Phase 3: OCR & Contact Management** (Days 5-7)
**Goal**: Upload cards, extract data, manage contacts with proper status tracking

#### Day 5: OCR Backend
- [ ] Set up Supabase Storage bucket
- [ ] Implement file upload endpoint
- [ ] Integrate Tesseract.js
- [ ] Create OCR processing pipeline with status updates
- [ ] Calculate confidence scores
- [ ] Set `processed_at` timestamps
- [ ] Queue low-confidence for review (`status = 'pending_review'`)

#### Day 6: Contact Management
- [ ] Contacts feature slice
- [ ] CRUD operations for contacts
- [ ] Status management (processing, completed, pending_review, user_verified, failed)
- [ ] Review workflow for pending contacts
- [ ] Filtering and search endpoints
- [ ] Bulk operations support
- [ ] Activity logging for contact actions

#### Day 7: Frontend Upload & Review
- [ ] Scan card page with drag-drop
- [ ] Upload progress indicators
- [ ] Contacts table with status badges
- [ ] Review modal for low-confidence results
- [ ] Bulk selection UI
- [ ] Status filtering

**Deliverable**: Complete card scanning and review workflow with proper status tracking

---

### **Phase 4: Lead Groups & Email Campaigns** (Days 8-10)
**Goal**: Organize contacts and generate personalized emails with export tracking

#### Day 8: Lead Groups
- [ ] Lead groups feature slice
- [ ] Many-to-many relationship management
- [ ] Group CRUD operations
- [ ] Frontend group management UI
- [ ] Add contacts to groups functionality
- [ ] Activity logging for group actions

#### Day 9: Email Templates & AI Generation
- [ ] Email templates feature slice
- [ ] Template CRUD with variables support
- [ ] OpenAI integration service
- [ ] Batch email generation logic
- [ ] Personalization algorithm
- [ ] Set `generated_at` timestamps on campaigns

#### Day 10: Campaign Management & Export
- [ ] Email campaigns feature slice
- [ ] Campaign creation flow
- [ ] CSV export functionality with tracking
- [ ] Multiple export formats (Gmail mail merge, contact list, full details)
- [ ] Export analytics (count, timestamps)
- [ ] Frontend campaign UI
- [ ] Export instructions and help text

**Deliverable**: Complete email campaign workflow with export tracking

---

### **Phase 5: Dashboard & Analytics** (Days 11-12)
**Goal**: Add meaningful analytics and improve UX

#### Day 11: Dashboard & Analytics
- [ ] Analytics feature slice
- [ ] Dashboard statistics queries:
  - Total contacts by status
  - Contacts needing review count
  - Events created
  - Lead groups count
  - Average processing time
  - Time from upload to email generation
- [ ] Frontend dashboard components
- [ ] Charts and visualizations
- [ ] Recent activity feed from activity_logs

#### Day 12: Polish & Testing
- [ ] Error handling improvements
- [ ] Loading states everywhere
- [ ] Empty states design
- [ ] Responsive design check
- [ ] Basic E2E testing
- [ ] Documentation update

**Deliverable**: Polished, production-ready MVP with analytics

---

### **Phase 6: Deployment** (Days 13-14)
**Goal**: Deploy to production

#### Day 13: Deployment Setup
- [ ] Set up Vercel for frontend
- [ ] Set up Render for backend
- [ ] Configure environment variables
- [ ] Set up domain and SSL
- [ ] Test production build

#### Day 14: Launch Preparation
- [ ] User documentation
- [ ] Video walkthrough
- [ ] Bug fixes from testing
- [ ] Performance optimization
- [ ] Backup procedures

**Deliverable**: Live production application

---

## 🚦 Risk Mitigation

### Technical Risks
1. **OCR Accuracy**: Mitigated by review queue for low-confidence results and proper status tracking
2. **AI Rate Limits**: Implement queuing and retry logic
3. **File Upload Size**: Set reasonable limits, compress images
4. **Data Consistency**: Use database constraints and proper status enums

### Schedule Risks
1. **Feature Creep**: Stick to MVP scope, document future features
2. **Integration Issues**: Test integrations early (Day 2)
3. **Deployment Surprises**: Deploy early and often

---

## 📈 Success Metrics & Analytics

### Database-Driven Metrics
With the updated schema, track:
- **Contact Status Distribution**: Visual breakdown of processing pipeline
- **Processing Performance**: Average time from upload to completion
- **Review Queue Health**: Number of contacts pending review
- **Campaign Success**: Time from contact creation to email generation
- **Export Analytics**: Which campaigns are being used

### Week 1 Checkpoint
- [ ] Events can be created and viewed
- [ ] Business cards can be uploaded with proper status tracking
- [ ] OCR extracts basic information with confidence scoring

### Week 2 Checkpoint
- [ ] Complete workflow from card to email with timestamps
- [ ] CSV export works with tracking
- [ ] Dashboard shows meaningful analytics
- [ ] Deployed to production

### Post-Launch Metrics
- Number of cards processed by status
- OCR accuracy rate by confidence threshold
- Time from upload to email generation
- Export frequency and formats used
- User feedback on workflow

---

## 🔄 Daily Routine

1. **Morning**: Review plan, set day's goals
2. **Coding**: 2-3 hour focused blocks
3. **Testing**: Test each feature as built, verify activity logging
4. **Commit**: Push to GitHub (multiple times daily)
5. **Document**: Update progress, note blockers

---

## 📝 Future Enhancements (Post-MVP)

1. **Background Processing**: Use the `ocr_jobs` table for async OCR
2. **Gmail OAuth Integration**: Direct sending to Gmail drafts
3. **Multi-user Support**: Add authentication and organizations
4. **Mobile App**: React Native for on-the-go scanning
5. **Advanced Analytics**: Conversion tracking, email metrics
6. **CRM Integrations**: Sync with Salesforce, HubSpot
7. **Bulk Processing**: Handle 100+ cards at once
8. **AI Improvements**: Better personalization, follow-up suggestions

---

## ✅ Go/No-Go Checklist

Before starting development:
- [ ] Supabase account created
- [ ] OpenAI API key obtained
- [ ] GitHub repository created
- [ ] Development environment ready
- [ ] 2-3 hours daily available for coding
- [ ] Sample business cards for testing
- [ ] Updated database schema reviewed and understood

**Ready to begin? Let's start with Phase 1!**