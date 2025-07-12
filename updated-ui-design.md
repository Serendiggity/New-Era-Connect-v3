# Updated UI Design for MVP

## Key Changes from Original

### 1. **Emails Page Simplification**
- **Remove**: Gmail Connection Status section (no OAuth needed)
- **Add**: Export options after draft generation
- **Modify**: "View & Send" button becomes "Preview" button

### 2. **New Components**

#### Export Options Component
After generating drafts, show:
```
[✓] Drafts generated successfully!

Export Options:
[📊 Export for Gmail Mail Merge] [📋 Export Contact List] [📄 Export Full Details]

📖 How to use: Upload the CSV to Gmail's mail merge or your preferred email tool.
```

### 3. **Contacts Page Enhancement**
Add status badges to the contact table:
- 🟢 Verified (user reviewed)
- 🟡 Needs Review (low OCR confidence)
- 🔵 Completed (high confidence)
- 🔴 Failed (OCR error)
- ⏳ Processing

### 4. **Dashboard Stats Update**
Replace "Avg. Card Accuracy" with "Contacts Needing Review" - more actionable!

## Complete Page Structure

### **Dashboard (`/`)**
- Total Contacts
- Events Created  
- Lead Groups
- **Contacts Needing Review** (was Avg. Accuracy)
- Recent Activity List

### **Events (`/events`)**
- No changes - perfect as is

### **Event Detail (`/events/:id`)**
- No changes - tabs work great

### **Scan Card (`/scan`)**
- Add preview of uploaded image before submit
- Show upload progress indicator

### **Contacts (`/contacts`)**
- Add status column with badges
- Add "Review" action button for pending contacts
- Bulk actions: Export Selected, Add to Group

### **Email Campaigns (`/emails`)**
**Three sections:**
1. **Draft Generation**
   - Select Lead Group
   - Select Template  
   - Generate Drafts button

2. **Export Section** (NEW - replaces Gmail connection)
   - Shows after generation
   - Multiple export format options
   - Clear instructions

3. **Templates & History**
   - Email Templates tab (create/edit/delete)
   - Campaign History tab (view past generations with re-export option)

### **Review Modal** (NEW)
For low-confidence OCR results:
- Left side: Business card image
- Right side: Editable form fields
- OCR confidence indicators per field
- Save & Next button for bulk review