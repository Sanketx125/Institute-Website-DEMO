# Deekshaam public website and staff access

The public site runs at `http://localhost:3000`. The staff entry is **Staff sign in** in the upper information bar, the mobile navigation, and the footer. The main navigation contains the public pages and Apply Now. The staff form is at `http://localhost:3000/admin/login`.

The bootstrap administrator email is `admin@deekshaam.edu`. The password comes from `ADMIN_PASSWORD` in the API environment. The local root `.env` is ignored by Git and contains the credential for this workspace; do not commit or publish it. `STAFF_PASSWORD` sets the initial admissions account password. The API now refuses to start if either password is missing. For a deployed environment, set these values through the host's secret manager and use separate, rotated credentials.

If the regular API was already running when `.env` was created or changed, it must restart before the new password takes effect. The current API stores edits, applications, and user changes in memory, so restarting it discards that process's changes. Preserve any needed data before restarting.

The public route review covered the homepage, degrees and details, comparison, certifications, admissions and application, tracking, visit and contact, campus, placements, About, news, events, and gallery at phone, tablet, and desktop widths. 

Content editors and administrators can now use **Success stories**, **Events**, and **Photo gallery** in the staff workspace. Each item can be saved as a draft, published, edited, or archived. Images can be uploaded from the editor. Student stories require a consent confirmation before publication. The **Media library** assigns YouTube videos to Campus Life, Placements, or About; up to six also feature on the homepage. No student testimonials or YouTube videos are invented or seeded. The example future events are drafts until the team confirms and publishes their details. Generic program artwork is labeled as illustrative in the gallery.

## Deployment status

This repository is not yet safe to present as a fully production-backed platform. The API controllers currently use temporary memory even when PostgreSQL is reachable. Database-backed persistence for content, staff users, applications, leads, and payments, configured Razorpay credentials, and durable media storage are required before a live deployment. The working local admin account is a real email/password login through `/api/auth/login`; there is no role-picker or demo login endpoint.
