# Feature Backlog

This document tracks planned features and enhancements for future development cycles beyond the initial MVP.

## AI-Enhanced OCR Detection

**Priority**: Medium  
**Estimated Effort**: 2-3 hours  
**Status**: Planned  

### Overview
Add optional AI-powered enhancement to business card OCR processing using OpenAI API. Users can toggle this feature on/off via UI control for better accuracy when needed.

### User Story
As a user uploading business cards, I want the option to use AI-enhanced OCR detection so that I can get more accurate contact extraction when the standard OCR struggles with complex layouts or unclear text.

### Technical Requirements

#### Frontend Changes
- [ ] Add toggle switch to BusinessCardUpload component
- [ ] Add "AI Enhancement" option with cost/accuracy indicator
- [ ] Pass `useAiEnhancement: boolean` to upload API
- [ ] Show badge/indicator when contact was AI-enhanced
- [ ] Add loading state for AI processing (longer than basic OCR)

#### Backend Changes
- [ ] Add `ai_enhancement?: boolean` parameter to upload endpoints
- [ ] Create `AiOcrEnhancementService` class with OpenAI integration
- [ ] Implement prompt engineering for contact extraction:
  ```
  Extract contact information from this business card OCR text.
  Identify: person's name, job title, company, email, phone, LinkedIn.
  Return structured JSON with confidence scores.
  Distinguish between name vs title vs company name.
  ```
- [ ] Modify OCR job processing to conditionally use AI enhancement
- [ ] Add fallback logic if OpenAI API fails
- [ ] Add cost tracking/logging for AI API usage

#### Database Changes
- [ ] Add `ai_enhanced: boolean` field to contacts table
- [ ] Track AI enhancement usage in activity logs
- [ ] Store AI confidence scores separately from OCR confidence

#### Environment Configuration
- [ ] Ensure OPENAI_API_KEY is configured
- [ ] Add AI enhancement feature flag in .env
- [ ] Add cost/rate limiting configuration

### Implementation Plan

1. **Phase 1**: Backend service (1 hour)
   - Create AiOcrEnhancementService
   - Add OpenAI prompt and response parsing
   - Test with sample OCR text

2. **Phase 2**: Integration (1 hour)
   - Modify upload endpoints to accept AI enhancement flag
   - Update OCR job processing logic
   - Add database field and logging

3. **Phase 3**: Frontend UI (1 hour)
   - Add toggle component to upload forms
   - Update API calls to include enhancement flag
   - Add visual indicators for AI-enhanced contacts

### Success Criteria
- [ ] User can toggle AI enhancement on/off
- [ ] AI-enhanced extractions show significantly better accuracy for complex business cards
- [ ] System gracefully falls back to basic OCR if AI fails
- [ ] Cost tracking shows reasonable API usage
- [ ] Processing time remains under 10 seconds total

### Future Enhancements
- Auto-suggest AI enhancement for low-confidence OCR results
- Batch AI processing for multiple cards
- Custom prompts for specific industries
- AI-powered duplicate detection and contact merging

---

### Direct Camera Upload for Contacts
**Priority**: Medium  
**Effort**: 2-3 hours  
- Add camera capture functionality directly in contact creation flow
- Allow users to take photos of business cards using device camera
- Integrate with existing OCR processing pipeline
- Support both file upload and direct camera capture

---

## Other Planned Features

### Lead Scoring System
**Priority**: Low  
**Effort**: 4-6 hours  
- Automatic lead scoring based on contact data quality, company size, industry
- Integration with external APIs for company enrichment
- Scoring dashboard and filtering

### Advanced Email Templates
**Priority**: Medium  
**Effort**: 3-4 hours  
- Rich text editor for email templates
- Template variables and conditional content
- A/B testing for email campaigns
- Template marketplace/sharing

### Mobile App
**Priority**: Low  
**Effort**: 40+ hours  
- React Native mobile app for on-the-go card scanning
- Offline OCR processing
- Sync with web application
- Camera optimization for business cards

### Analytics Dashboard
**Priority**: Medium  
**Effort**: 6-8 hours  
- Contact acquisition metrics over time
- OCR accuracy trends
- Campaign performance analytics
- Export/reporting functionality