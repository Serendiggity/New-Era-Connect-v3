# contacts

Purpose                : Business card OCR processing and contact management with file uploads
Public API             : • ContactsService • uploadService • ocrService • ocrJobService • contactsRouter
Dependencies           : shared/db • shared/middleware • tesseract.js • @supabase/supabase-js • multer
How to test            : npm run test -- contacts

## Features

- File upload with Supabase Storage integration
- OCR text extraction using Tesseract.js with confidence scoring
- Background job processing for OCR tasks
- Contact creation and management with OCR results
- Review workflow for low-confidence OCR results
- Activity logging for all operations

## API Endpoints

- `POST /api/contacts/upload` - Upload business card and create contact
- `POST /api/contacts/:id/upload` - Upload business card for existing contact
- `GET /api/contacts/:id/ocr-jobs` - Get OCR jobs for contact
- `POST /api/contacts/process-pending-ocr` - Process pending OCR jobs