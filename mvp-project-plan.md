# Business Card Lead Manager - Enhanced MVP Project Plan

## 🎯 Project Overview

**Goal**: Build a functional MVP that enables users to scan business cards from events, extract contact information via OCR, organize leads into groups, and generate personalized email campaigns with AI.

**Timeline**: 10-14 days to working MVP  
**Approach**: Single-user system, feature-sliced architecture, CSV export for emails
**Multi-Agent Enhancement**: Cursor + Claude Code parallel development for 50% speed improvement

---

## 📊 Success Criteria

- [ ] User can create and manage events
- [ ] Business cards can be uploaded and processed with OCR
- [ ] Low-confidence OCR results can be reviewed and corrected
- [ ] Contacts can be organized into lead groups
- [ ] AI generates personalized emails from templates
- [ ] Email campaigns can be exported as CSV for mail merge
- [ ] Dashboard shows key metrics and activity
- [ ] **Multi-agent workflow** achieves 50% faster development
- [ ] **MCP integration** provides real-time database access

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
- **🆕 MCP Integration**: Shared servers for both agents
- **🆕 Multi-Agent**: Cursor (frontend) + Claude Code (backend)

### Project Structure
```
business-card-manager/
├── client/          # React frontend (Cursor focus)
├── server/          # Express backend (Claude Code focus)
├── shared/          # Shared types
├── docs/           # Documentation
├── .claude/        # Claude Code MCP configuration
└── workflow-enhancement/  # Enhanced development files
```

### Key Implementation Notes
- **Consistent Naming**: Use `status` field consistently across all entities
- **Activity Tracking**: Log all major actions using standardized action names
- **Timestamp Strategy**: Track processing milestones for analytics
- **Single-User**: Hard-code user_id = 1 in all database operations
- **🆕 Agent Coordination**: Use structured handoff messages with MCP context
- **🆕 Performance Monitoring**: Track development speed and quality metrics

---

## 📅 Enhanced Development Phases

### **Phase 1: Foundation Setup** (Days 1-2)
**Goal**: Get the basic infrastructure running with multi-agent workflow

#### Day 1: Project Initialization
- [ ] Create monorepo with pnpm workspaces
- [ ] Set up TypeScript configs
- [ ] Initialize Git repository
- [ ] Create Supabase project
- [ ] Run database migrations (use updated schema)
- [ ] Set up environment variables
- [ ] **🆕 Configure MCP servers** for both Cursor and Claude Code
- [ ] **🆕 Set up multi-agent port allocation** (Slot A: Cursor 3000/8000, Slot B: Claude 3002/8002)

**Multi-Agent Approach**:
- **Claude Code**: Database setup, environment configuration, MCP server setup
- **Cursor**: Project structure creation, package.json setup, documentation

**Deliverable**: Empty but properly configured project with MCP integration

#### Day 2: Core Infrastructure
- [ ] Express server with feature-sliced structure
- [ ] React app with routing
- [ ] Shadcn/ui components setup
- [ ] Database connection with Drizzle
- [ ] Activity logging middleware setup
- [ ] Basic error handling
- [ ] Development scripts
- [ ] **🆕 Terminal-in-Cursor workflow** established
- [ ] **🆕 MCP server connectivity** verified

**Multi-Agent Approach**:
- **Parallel Development**: Claude Code sets up backend while Cursor configures frontend
- **Integration Points**: Both agents test MCP connectivity and coordinate via handoff messages

**Deliverable**: "Hello World" fullstack app deployed with multi-agent workflow operational

---

### **Phase 2: Event Management** (Days 3-4)
**Goal**: Complete CRUD for events with activity tracking

#### Day 3: Backend Implementation
- [ ] Create events feature slice
- [ ] Implement events.service.ts (CRUD operations)
- [ ] Implement events.routes.ts (REST endpoints)
- [ ] Add validation with Zod
- [ ] Add activity logging for event actions
- [ ] Test with Postman/Thunder Client
- [ ] **🆕 Use @supabase MCP** for real-time database queries

**Agent Assignment**: **Claude Code leads** (complexity: 6/10)

#### Day 4: Frontend Integration
- [ ] Events list page
- [ ] Create event modal
- [ ] Event detail page
- [ ] TanStack Query integration
- [ ] Loading and error states
- [ ] **🆕 Integration with Claude's APIs** using structured handoff

**Agent Assignment**: **Cursor leads** (complexity: 4/10)
**Handoff Protocol**: Claude provides API documentation, Cursor implements UI

**Deliverable**: Fully functional event management with activity logs and coordinated development

---

### **Phase 3: OCR & Contact Management** (Days 5-7)
**Goal**: Upload cards, extract data, manage contacts with proper status tracking

#### Day 5: OCR Backend Implementation
- [ ] Set up Supabase Storage bucket
- [ ] Implement file upload endpoint
- [ ] Integrate Tesseract.js
- [ ] Create OCR processing pipeline with status updates
- [ ] Calculate confidence scores
- [ ] Set `processed_at` timestamps
- [ ] Queue low-confidence for review (`status = 'pending_review'`)
- [ ] **🆕 Use @taskmaster-ai MCP** for complex task breakdown

**Agent Assignment**: **Claude Code leads** (complexity: 8/10)
**MCP Usage**: @supabase for database operations, @web-eval-agent for Tesseract.js best practices

#### Day 6: Contact Management Backend
- [ ] Contacts feature slice
- [ ] CRUD operations for contacts
- [ ] Status management (processing, completed, pending_review, user_verified, failed)
- [ ] Review workflow for pending contacts
- [ ] Filtering and search endpoints
- [ ] Bulk operations support
- [ ] Activity logging for contact actions

**Agent Assignment**: **Claude Code continues** (complexity: 7/10)

#### Day 7: Frontend Upload & Review Interface
- [ ] Scan card page with drag-drop
- [ ] Upload progress indicators
- [ ] Contacts table with status badges
- [ ] Review modal for low-confidence results
- [ ] Bulk selection UI
- [ ] Status filtering
- [ ] **🆕 Real-time status updates** using Claude's WebSocket implementation

**Agent Assignment**: **Cursor leads** (complexity: 5/10)
**Parallel Development**: While Cursor builds UI, Claude Code optimizes OCR performance

**Deliverable**: Complete card scanning and review workflow with coordinated multi-agent development

---

### **Phase 4: Lead Groups & Email Campaigns** (Days 8-10)
**Goal**: Organize contacts and generate personalized emails with export tracking

#### Day 8: Lead Groups Implementation
- [ ] Lead groups feature slice
- [ ] Many-to-many relationship management
- [ ] Group CRUD operations
- [ ] Frontend group management UI
- [ ] Add contacts to groups functionality
- [ ] Activity logging for group actions

**Multi-Agent Approach**: 
- **Claude Code**: Backend service implementation (complexity: 6/10)
- **Cursor**: UI components in parallel (complexity: 4/10)
- **Coordination**: Regular sync points every 2 hours

#### Day 9: Email Templates & AI Generation
- [ ] Email templates feature slice
- [ ] Template CRUD with variables support
- [ ] OpenAI integration service
- [ ] Batch email generation logic
- [ ] Personalization algorithm
- [ ] Set `generated_at` timestamps on campaigns
- [ ] **🆕 Use @taskmaster-ai MCP** for AI prompt optimization

**Agent Assignment**: **Claude Code leads** (complexity: 7/10)
**MCP Integration**: @web-eval-agent for OpenAI best practices research

#### Day 10: Campaign Management & Export
- [ ] Email campaigns feature slice
- [ ] Campaign creation flow
- [ ] CSV export functionality with tracking
- [ ] Multiple export formats (Gmail mail merge, contact list, full details)
- [ ] Export analytics (count, timestamps)
- [ ] Frontend campaign UI
- [ ] Export instructions and help text

**Multi-Agent Approach**:
- **Claude Code**: Export logic and analytics (complexity: 6/10)
- **Cursor**: Campaign UI and export interface (complexity: 4/10)

**Deliverable**: Complete email campaign workflow with export tracking and optimized multi-agent coordination

---

### **Phase 5: Dashboard & Analytics** (Days 11-12)
**Goal**: Add meaningful analytics and improve UX

#### Day 11: Dashboard & Analytics Backend
- [ ] Analytics feature slice
- [ ] Dashboard statistics queries:
  - Total contacts by status
  - Contacts needing review count
  - Events created
  - Lead groups count
  - Average processing time
  - Time from upload to email generation
- [ ] **🆕 Real-time analytics** using @supabase MCP
- [ ] **🆕 Multi-agent performance metrics** tracking

**Agent Assignment**: **Claude Code leads** (complexity: 6/10)

#### Day 11 (Parallel): Dashboard Frontend
- [ ] Frontend dashboard components
- [ ] Charts and visualizations
- [ ] Recent activity feed from activity_logs
- [ ] **🆕 Real-time updates** integration
- [ ] **🆕 Multi-agent development metrics** display

**Agent Assignment**: **Cursor parallel development** (complexity: 5/10)

#### Day 12: Polish & Testing
- [ ] Error handling improvements
- [ ] Loading states everywhere
- [ ] Empty states design
- [ ] Responsive design check
- [ ] **🆕 Multi-agent integration testing**
- [ ] **🆕 MCP server performance testing**
- [ ] Documentation update

**Multi-Agent Approach**: Both agents focus on their respective areas with coordinated testing

**Deliverable**: Polished, production-ready MVP with analytics and proven multi-agent workflow

---

### **Phase 6: Deployment** (Days 13-14)
**Goal**: Deploy to production

#### Day 13: Deployment Setup
- [ ] Set up Vercel for frontend
- [ ] Set up Render for backend
- [ ] Configure environment variables
- [ ] **🆕 Configure production MCP servers** with proper security
- [ ] Set up domain and SSL
- [ ] Test production build

**Agent Assignment**: **Claude Code leads** (complexity: 6/10)

#### Day 14: Launch Preparation
- [ ] User documentation
- [ ] **🆕 Multi-agent workflow documentation** for future development
- [ ] Video walkthrough
- [ ] Bug fixes from testing
- [ ] Performance optimization
- [ ] Backup procedures
- [ ] **🆕 MCP security audit**

**Multi-Agent Approach**: Both agents contribute to documentation and final testing

**Deliverable**: Live production application with documented multi-agent development process

---

## 🚦 Enhanced Risk Mitigation

### Technical Risks
1. **OCR Accuracy**: Mitigated by review queue for low-confidence results and proper status tracking
2. **AI Rate Limits**: Implement queuing and retry logic
3. **File Upload Size**: Set reasonable limits, compress images
4. **Data Consistency**: Use database constraints and proper status enums
5. **🆕 MCP Server Failures**: Graceful degradation with fallback procedures
6. **🆕 Agent Coordination Issues**: Clear handoff protocols and conflict resolution

### Multi-Agent Risks
1. **Context Mismatch**: Mitigated by MCP-verified state sharing
2. **Merge Conflicts**: Coordinated file ownership and frequent syncing
3. **Performance Bottlenecks**: Regular session optimization and token management
4. **Security Issues**: Proper MCP token scoping and rotation

### Schedule Risks
1. **Feature Creep**: Stick to MVP scope, document future features
2. **Integration Issues**: Test integrations early (Day 2) with both agents
3. **Deployment Surprises**: Deploy early and often
4. **🆕 Agent Learning Curve**: Gradual adoption of multi-agent patterns

---

## 📈 Enhanced Success Metrics & Analytics

### Multi-Agent Performance Metrics
- **Development Speed**: Target 50% faster than single-agent approach
- **Code Quality**: Maintain >80% test coverage with both agents
- **Integration Success**: <2 merge conflicts per week
- **Handoff Efficiency**: <3 handoffs per major feature
- **Context Accuracy**: Zero context loss (MCP-verified)

### Database-Driven Metrics
With the updated schema and MCP integration, track:
- **Contact Status Distribution**: Visual breakdown of processing pipeline
- **Processing Performance**: Average time from upload to completion
- **Review Queue Health**: Number of contacts pending review
- **Campaign Success**: Time from contact creation to email generation
- **Export Analytics**: Which campaigns are being used
- **🆕 Agent Productivity**: Tasks completed per agent per hour
- **🆕 MCP Usage**: Server response times and error rates

### Week 1 Checkpoint
- [ ] Events can be created and viewed
- [ ] Business cards can be uploaded with proper status tracking
- [ ] OCR extracts basic information with confidence scoring
- [ ] **🆕 Multi-agent workflow** operational with handoff protocols
- [ ] **🆕 MCP servers** providing real-time database access

### Week 2 Checkpoint
- [ ] Complete workflow from card to email with timestamps
- [ ] CSV export works with tracking
- [ ] Dashboard shows meaningful analytics
- [ ] Deployed to production
- [ ] **🆕 50% development speed improvement** achieved
- [ ] **🆕 Multi-agent coordination** smooth and efficient

### Post-Launch Metrics
- Number of cards processed by status
- OCR accuracy rate by confidence threshold
- Time from upload to email generation
- Export frequency and formats used
- User feedback on workflow
- **🆕 Multi-agent development efficiency** for future features
- **🆕 MCP server performance** and reliability

---

## 🔄 Enhanced Daily Routine

### Multi-Agent Coordination
1. **Morning**: 
   - Review overnight progress from both agents
   - Check MCP server status and token validity
   - Plan day's parallel development tracks
   - Assign complexity-based task routing

2. **Development**: 
   - 2-3 hour focused blocks per agent
   - Terminal-in-Cursor pattern for Claude Code
   - Regular sync points every 30 minutes for complex features
   - MCP-enhanced context sharing

3. **Integration**: 
   - Test each feature as built
   - Verify activity logging
   - Cross-agent code review using Cursor's diff view
   - MCP state verification

4. **Coordination**: 
   - Push to GitHub multiple times daily
   - Structured handoff messages with MCP context
   - Update feature slice READMEs with agent notes

5. **Documentation**: 
   - Update progress with agent attribution
   - Note blockers and resolution strategies
   - Track multi-agent performance metrics

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
9. **🆕 Advanced MCP Servers**: Custom servers for specialized workflows
10. **🆕 Multi-Agent Scaling**: Support for 3+ agents on larger projects

---

## ✅ Enhanced Go/No-Go Checklist

Before starting development:
- [ ] Supabase account created
- [ ] OpenAI API key obtained
- [ ] GitHub repository created
- [ ] Development environment ready
- [ ] 2-3 hours daily available for coding
- [ ] Sample business cards for testing
- [ ] Updated database schema reviewed and understood
- [ ] **🆕 MCP servers configured** and tested
- [ ] **🆕 Both agents have access** to shared MCP configuration
- [ ] **🆕 Multi-agent workflow** understood by development team
- [ ] **🆕 Security tokens** properly scoped and rotated

**Ready to begin? Let's start with Phase 1 using the enhanced multi-agent approach!**