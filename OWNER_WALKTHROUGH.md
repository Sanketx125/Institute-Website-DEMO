# Deekshaam Business School - Owner Review Walkthrough

This build is designed to be reviewed as the future public website, not as a slide-style prototype. The recommended walkthrough is below.

1. **Home** - institutional brand, current academic positioning, program discovery, campus story, career/employer proof, certifications, leadership and admissions calls-to-action.
2. **Programs mega-menu** - BBA, BCA and B.Com are first-class routes rather than cards that lead to disconnected pages.
3. **BCA program page** - show the consistent production template: program overview, eligibility, specializations, curriculum, career pathways and application entry.
4. **Compare Programs** - side-by-side decision support for students and parents.
5. **Professional Certifications** - current certification areas organized by domain rather than generic LMS/template courses.
6. **Admissions mega-menu** - admissions overview, application, status tracking, parent information and campus visit are part of one connected journey.
7. **Apply** - multi-step application with save/resume behavior, program pre-selection, review and application ID generation in the owner-review environment.
8. **Track Application** - enter the generated ID to see the proposed application-status journey.
9. **For Parents** - dedicated decision journey covering recognition, academics, hostel/campus, fees/verification and contact pathways.
10. **Placements & Careers** - organizations currently published by DBS, with career-development structure and no invented placement percentages or packages.
11. **Campus Life + Visit Campus** - campus information, location and a structured visit-booking flow.
12. **About** - institution positioning and current public leadership profiles with their published photographs.
13. **Global Search** - press Ctrl/Cmd + K and search for programs, admissions, hostel, certifications or application information.
14. **Deeksha Guide** - future-facing admissions assistant interface driven by the centralized program/certification content model. It is intentionally isolated from a live LLM until the approved institutional knowledge base and API/security design are connected.
15. **Mobile view** - review the condensed navigation and persistent Call / Visit / Apply actions.

## What changes after owner approval

The frontend architecture is already separated from service integration. When the institution supplies its current codebase, CMS/database model, CRM, payment flow and approved brand/media masters, the same experience can be connected through the included gateways rather than being redesigned from zero.

For public launch, replace the review logo source with the official self-hosted master SVG/PNG supplied by the institution, verify academic/fee/placement content with the relevant owners, connect the real APIs, complete security/privacy/accessibility/performance testing, and remove the review-only `noindex` setting.
