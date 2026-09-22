# Deekshaam Production Platform — REST API Specification

All API endpoints reside under `/api` and return standardized envelopes:
```json
{
  "success": true,
  "data": { ... }
}
```
Errors return:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": []
  }
}
```

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT bearer token |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current logged-in user profile & role |

---

## 2. Core CMS (`/api/cms`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cms/settings` | Public | Retrieves global site settings & contacts |
| `PUT` | `/api/cms/settings` | Super Admin | Updates institutional identity and branding |
| `GET` | `/api/cms/programs` | Public | Retrieves degree catalog (BBA, BCA, B.Com) |
| `GET` | `/api/cms/programs/:slug` | Public | Retrieves specific degree with 6-semester curriculum |
| `POST` | `/api/cms/programs` | Content Admin | Creates new degree program |
| `PUT` | `/api/cms/programs/:id` | Content Admin | Updates degree program details |
| `DELETE`| `/api/cms/programs/:id` | Content Admin | Removes degree program |
| `GET` | `/api/cms/certifications`| Public | Retrieves professional certifications catalog |
| `GET` | `/api/cms/faculty` | Public | Retrieves faculty and leadership profiles |
| `GET` | `/api/cms/employers` | Public | Retrieves verified placement partners |
| `GET` | `/api/cms/news` | Public | Lists published news and career articles |
| `GET` | `/api/cms/news/:slug` | Public | Retrieves full article content |
| `POST` | `/api/cms/news` | Content Admin | Publishes new article |
| `GET` | `/api/cms/events` | Public | Retrieves campus calendar events |
| `POST` | `/api/cms/events` | Content Admin | Creates new campus event |
| `GET` | `/api/cms/gallery` | Public | Retrieves photo album assets |
| `GET` | `/api/cms/media` | Content Admin | Lists media library assets |
| `POST` | `/api/cms/media/upload` | Content Admin | Uploads image or document to public CDN storage |
| `GET` | `/api/cms/audit-logs` | Super Admin | Lists system security audit logs |

---

## 3. Admissions Workflow (`/api/admissions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admissions/apply` | Public | Submits multi-step application and issues reference ID |
| `GET` | `/api/admissions/track/:id` | Public | Retrieves milestone progress for application ID |
| `POST` | `/api/admissions/upload/:id`| Public/Applicant | Uploads applicant marksheets to private storage |
| `GET` | `/api/admissions/admin/applications` | Admission Staff | Lists applications with filters and search |
| `GET` | `/api/admissions/admin/applications/:id` | Admission Staff | Retrieves application details and documents |
| `PATCH`| `/api/admissions/admin/applications/:id/status` | Admission Staff | Updates application stage and remarks |
| `GET` | `/api/admissions/admin/documents/:docId/download` | Admission Staff | Securely streams private applicant document |

---

## 4. Enquiries & Leads (`/api/enquiries`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/enquiries` | Public | Captures general query or callback request |
| `POST` | `/api/enquiries/visit` | Public | Books campus visit appointment with time slot |
| `GET` | `/api/enquiries/admin` | Enquiry Staff | Lists incoming leads with filter & search |
| `PATCH`| `/api/enquiries/admin/:id` | Enquiry Staff | Updates lead lifecycle status and counselor assignment |

---

## 5. Payments Workflow (`/api/payments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/create-order` | Public | Creates Razorpay order reference |
| `POST` | `/api/payments/verify` | Public | Verifies HMAC SHA-256 signature and captures payment |
| `POST` | `/api/payments/webhook` | Gateway | Processes Razorpay webhook events idempotently |
| `GET` | `/api/payments/admin` | Super Admin | Lists payment transactions for reconciliation |

---

## 6. Search, SEO & Analytics (`/api/search`, `/api/seo`, `/api/analytics`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/search?q=...` | Public | Full-text search across programs, news, and pages |
| `GET` | `/sitemap.xml` | Public | Generates dynamic XML sitemap of all published URLs |
| `GET` | `/robots.txt` | Public | Serves production crawler directives |
| `POST` | `/api/analytics/event` | Public | Ingests first-party telemetry event |
| `GET` | `/api/analytics/summary` | Super Admin | Returns metrics summary for Admin Dashboard |

---

## 7. AI Assistant (`/api/ai`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Public | Queries Deeksha Guide with institution knowledge scope |
