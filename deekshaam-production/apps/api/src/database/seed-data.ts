export const defaultRoles = [
  {
    name: 'SUPER_ADMIN',
    description: 'Complete system administration, access control, audit logs, and payments',
  },
  {
    name: 'CONTENT_ADMIN',
    description: 'CMS management for pages, programs, news, events, notices, and media',
  },
  {
    name: 'ADMISSION_STAFF',
    description: 'Admissions inbox, application review, document inspection, and status updates',
  },
  {
    name: 'ENQUIRY_STAFF',
    description: 'Lead inbox, callback management, and campus visit scheduling',
  },
];

export const defaultPermissions = [
  { code: 'cms:read', description: 'View CMS content' },
  { code: 'cms:write', description: 'Create and update CMS content' },
  { code: 'cms:publish', description: 'Publish or archive CMS content' },
  { code: 'admissions:read', description: 'View applications and applicant documents' },
  { code: 'admissions:write', description: 'Update application statuses and records' },
  { code: 'leads:read', description: 'View enquiry leads and visit bookings' },
  { code: 'leads:write', description: 'Update lead statuses and assign leads' },
  { code: 'payments:read', description: 'View payments and reconciliation reports' },
  { code: 'users:manage', description: 'Manage staff accounts and roles' },
  { code: 'audit:read', description: 'View immutable system audit logs' },
  { code: 'settings:manage', description: 'Manage site settings and global configuration' },
];

export const institutionSeed = {
  instituteName: 'Deekshaam Business School',
  shortName: 'DBS',
  managedBy: 'Deeksha Education Trust',
  founded: '2021',
  phone: '+91 8971435297',
  admissionEmail: 'admission@deekshaedu.in',
  contactEmail: 'contact@deekshaedu.in',
  address: 'MY Samruddhi Nagar, Venkatapura Village, PO-Kundana Hobli, Devanahalli Taluk, Bangalore - 562110',
  coordinates: '13.2611403,77.5988094',
  affiliations: ['AICTE, New Delhi', 'Government of Karnataka', 'Bengaluru North University'],
  heroImage: 'https://deekshaedu.in/wp-content/uploads/2025/03/Deekshaam-Buisness-School-Img-1.png',
  campusImage: 'https://deekshaedu.in/wp-content/uploads/2025/03/Deekshaam-Buisness-School-Img-1.png',
  logoImage: '/logo.svg',
  socialLinksJson: JSON.stringify({
    facebook: 'https://facebook.com/deekshaam',
    instagram: 'https://instagram.com/deekshaam',
    linkedin: 'https://linkedin.com/school/deekshaam',
    youtube: 'https://youtube.com/@deekshaam',
  }),
  seoDefaultsJson: JSON.stringify({
    title: 'Deekshaam Business School | UG Programs & Professional Certifications',
    description: 'Study BBA, BCA and B.Com in Bangalore at Deekshaam Business School. AICTE approved, university affiliated with work-integrated learning.',
    keywords: 'Deekshaam, Business School, BBA Bangalore, BCA Bangalore, B.Com Bangalore, Devanahalli College',
  }),
};

export const programsSeed = [
  {
    slug: 'bba',
    code: 'BBA',
    title: 'Bachelor of Business Administration',
    kicker: 'Management, analytics and digital business',
    duration: '3 years',
    mode: 'Classroom + live interactive learning',
    eligibility: '10+2 in Humanities, Commerce or Science from a recognized board; minimum 50% aggregate (45% for SC/ST/OBC candidates).',
    image: 'https://deekshaedu.in/wp-content/uploads/2024/03/2.png',
    summary: 'Build a strong base in management, commerce and data-led decision making through applied projects, industry exposure and specialization pathways.',
    specializations: ['Digital Marketing + AI', 'Business Analytics', 'Travel & Tourism Management', 'Banking & Finance Management', 'Hotel Management', 'Marketing Management', 'Supply Chain & Inventory', 'Logistics Management'],
    careers: ['Business Analyst', 'Marketing Analyst', 'Operations Executive', 'Financial Services Associate', 'Sales and Growth Executive', 'Supply Chain Executive'],
    highlights: ['Industry-oriented curriculum', 'Project-centric learning', 'Case studies and presentations', 'Internship and industry exposure', 'Career preparation'],
    curriculum: [
      ['Mind Management & Human Values I', 'General English I', 'Business Management', 'Trends in Commerce', 'Quantitative Techniques I', 'Financial Accounting'],
      ['English II', 'Business Economics', 'Cost Accounting', 'Quantitative Techniques II', 'Mind Management & Human Values II', 'Project Centric Learning I'],
      ['Entrepreneurship Development', 'Marketing Management', 'Human Resource Management', 'Corporate Accounting', 'Organization Psychology', 'Indian Constitution'],
      ['Business Law', 'Production & Operations Management', 'Business Finance', 'Employee Compensation & Benefit Management', 'Environmental Studies', 'Project Centric Learning II'],
      ['International Business', 'Income Tax I', 'Financial Markets / Consumer Behaviour', 'International Finance / Service Marketing', 'Advanced Accounting / Retail Marketing', 'Business Oriented Computer Applications'],
      ['Income Tax II', 'Corporate Governance', 'Security Analysis / Advertising & Media', 'Financial Analysis / Digital Marketing', 'Negotiation Skills', 'Project Centric Learning III']
    ],
    status: 'PUBLISHED',
  },
  {
    slug: 'bca',
    code: 'BCA',
    title: 'Bachelor of Computer Applications',
    kicker: 'Software, data, cloud and intelligent systems',
    duration: '3 years',
    mode: 'Classroom + live interactive learning',
    eligibility: '10+2 in Humanities, Commerce or Science from a recognized board; minimum 50% aggregate (45% for SC/ST/OBC candidates).',
    image: 'https://deekshaedu.in/wp-content/uploads/2024/03/BCA.png',
    summary: 'Learn programming, databases, web development, networks, cloud and software engineering through practical labs and progressive project work.',
    specializations: ['Artificial Intelligence & Machine Learning', 'Data Analytics', 'Cyber Security', 'Cloud Computing'],
    careers: ['Software Developer', 'Web Developer', 'Network Administrator', 'System Administrator', 'IT Support Specialist', 'QA Tester'],
    highlights: ['Programming foundations', 'Hands-on labs', 'Database and web engineering', 'Cloud and AI exposure', 'Multi-semester project work'],
    curriculum: [
      ['Fundamentals of Mathematics', 'Computer Fundamentals and Organization', 'Programming in C', 'Introduction to Linux', 'Programming in C Lab', 'Linux Lab'],
      ['Operating System', 'OOP with C++', 'Data Structures using C', 'C++ Lab', 'Data Structures Lab', 'Project I'],
      ['Fundamentals of Information Security', 'RDBMS', 'Computer Networks', 'Programming in Java', 'RDBMS Lab', 'Java Programming Lab'],
      ['Software Engineering', 'Cloud Computing', 'Web Technology', 'Web Technology Lab', 'Data Warehouse and Data Mining', 'Project II'],
      ['.NET Technology', 'Analysis and Design of Algorithms', 'Artificial Intelligence', 'Algorithm Lab', '.NET Lab', 'Python / Interactive Web Applications'],
      ['OOAD and UML', 'Software Testing', 'Software Testing Lab', 'Introduction to Deep Learning', 'Project III']
    ],
    status: 'PUBLISHED',
  },
  {
    slug: 'bcom',
    code: 'B.Com',
    title: 'Bachelor of Commerce',
    kicker: 'Accounting, finance and modern business',
    duration: '3 years',
    mode: 'Classroom learning',
    eligibility: '10+2 in Humanities, Commerce or Science from a recognized board; minimum 50% aggregate (45% for SC/ST/OBC candidates).',
    image: 'https://deekshaedu.in/wp-content/uploads/elementor/thumbs/arts-1-qlt7sxguf5drb2bhqpcmn8bgp7vsuhsk0s0x3a09zc.jpg',
    summary: 'Build a strong foundation in accounting, finance, banking, taxation, marketing and business decision-making through six semesters of applied commerce learning.',
    specializations: ['Accounting & Finance', 'Banking & Insurance', 'E-Commerce'],
    careers: ['Accountant', 'Auditor', 'Banking Professional', 'Business Intelligence Analyst', 'Financial Analyst', 'Tax Consultant', 'Business Analyst', 'Data Consultant'],
    highlights: ['Six-semester undergraduate journey', 'Internships and project-centric learning', 'Financial modeling and analysis', 'Business communication and problem-solving', 'Career-oriented commerce skills'],
    curriculum: [
      ['Language I', 'General English I', 'Financial Accounting I', 'Human Resource Management', 'Quantitative Techniques', 'Business Economics', 'Mind Management & Human Values I'],
      ['Language II', 'General English II', 'Financial Accounting II', 'Applied Statistics', 'Entrepreneurship Development', 'Mind Management & Human Values II', 'Project Centric Learning I'],
      ['Corporate Accounting', 'Banking and Financial Institutions', 'Marketing Management', 'Management Information Systems', 'Organizational Behavior', 'Social Networking / Visual Narrative', 'Indian Constitution'],
      ['Cost Accounting', 'Financial Management', 'Brand Management', 'Organizational Dynamics', 'Internet Technology / Bio Medical Physics', 'Environmental Studies', 'Project Centric Learning II'],
      ['Management Accounting', 'Income Tax I', 'Principles of Auditing', 'Consumer Behavior / Advanced Financial Management', 'Service Marketing / Securities Analysis and Portfolio Management', 'Emotional Intelligence / Dramatics', 'Business Oriented Computer Language'],
      ['Income Tax II', 'International Business', 'Digital Marketing / Advanced Financial Markets and Services', 'International Marketing / Corporate Finance', 'Atmosphere & Climate Change / Spoken Kannada', 'Negotiation Skills', 'Project Centric Learning III']
    ],
    status: 'PUBLISHED',
  }
];

export const certificationsSeed = [
  { group: 'Marketing & Ecommerce', duration: '6 months', title: 'Digital Marketing with AI', text: 'SEO, SEM, social media, Google Ads, GA4 and practical AI-assisted marketing workflows.', status: 'PUBLISHED' },
  { group: 'Marketing & Ecommerce', duration: '6 months', title: 'Marketing Management', text: 'Branding, consumer behavior, strategic marketing and product planning.', status: 'PUBLISHED' },
  { group: 'Marketing & Ecommerce', duration: '6 months', title: 'Ecommerce Management', text: 'Digital business models, online retail operations and ecommerce ecosystems.', status: 'PUBLISHED' },
  { group: 'Technology & Data Science', duration: '6-11 months', title: 'Data Science', text: 'Python, machine learning, analytics and data visualization foundations.', status: 'PUBLISHED' },
  { group: 'Technology & Data Science', duration: '6-11 months', title: 'Data Analytics', text: 'Excel, SQL, Power BI, data mining and business-facing insight generation.', status: 'PUBLISHED' },
  { group: 'Technology & Data Science', duration: '6-11 months', title: 'Cloud Computing', text: 'AWS, Microsoft Azure, cloud architecture and cloud security fundamentals.', status: 'PUBLISHED' },
  { group: 'Technology & Data Science', duration: '6-11 months', title: 'Artificial Intelligence & ML', text: 'Neural networks, deep learning, Python ML libraries and applied AI concepts.', status: 'PUBLISHED' },
  { group: 'Banking, Finance & Business', duration: '6 months', title: 'Banking & Financial Services', text: 'Banking, insurance, risk, compliance and financial service operations.', status: 'PUBLISHED' },
  { group: 'Banking, Finance & Business', duration: '6 months', title: 'Finance & Accounting', text: 'Financial reporting, auditing, taxation basics and accounting standards.', status: 'PUBLISHED' },
  { group: 'Banking, Finance & Business', duration: '6 months', title: 'Taxation, Banking & Finance', text: 'Tax planning, direct and indirect tax concepts, and banking procedures.', status: 'PUBLISHED' }
];

export const leadersSeed = [
  { name: 'Pushpa B', role: 'Founder & Director', note: 'Deekshaam Business School / Deeksha Education Trust', image: 'https://deekshaedu.in/wp-content/uploads/2024/07/DSC_4910-1-233x300.jpg', isLeadership: true, order: 1 },
  { name: 'Manoj Baitha', role: 'Admin Head, Marketing & Admission Director', note: 'Institution leadership', image: 'https://deekshaedu.in/wp-content/uploads/elementor/thumbs/DSC_4912-qqsttij3ttx45tgp6ad1j0wzronhumosx27gwai7fg.jpg', isLeadership: true, order: 2 },
  { name: 'Dr. Tukaram', role: 'Principal', note: 'Academic leadership', image: 'https://deekshaedu.in/wp-content/uploads/2025/07/Screenshot-2025-07-25-102127.jpg', isLeadership: true, order: 3 }
];

export const employersSeed = [
  { name: 'Salesforce', logoUrl: 'https://deekshaedu.in/wp-content/uploads/2025/03/Sales-Force.jpg' },
  { name: 'HCLTech', logoUrl: 'https://deekshaedu.in/wp-content/uploads/2025/03/Hcl.jpg' },
  { name: 'ITC Limited', logoUrl: 'https://deekshaedu.in/wp-content/uploads/2025/03/ITC.jpg' },
  { name: 'HDFC Bank', logoUrl: 'https://deekshaedu.in/wp-content/uploads/2025/03/hdfc-bank.webp' },
  { name: 'MTR', logoUrl: 'https://deekshaedu.in/wp-content/uploads/2025/03/MTR.webp' },
  { name: 'Johnson Controls', logoUrl: 'https://deekshaedu.in/wp-content/uploads/2025/03/Johnsons-Control.webp' },
  { name: 'Hector Beverages', logoUrl: 'https://deekshaedu.in/wp-content/uploads/2025/03/Hector.webp' },
  { name: 'Kellogg\'s', logoUrl: 'https://deekshaedu.in/wp-content/uploads/2025/03/Kellogs.webp' }
];

export const newsSeed = [
  {
    slug: 'career-cbse-school-counsellor',
    category: 'Career',
    date: '25 Feb 2026',
    title: 'Career as a CBSE School Counsellor & Career Counsellor',
    summary: 'Guidance and preparation needed for aspiring school counsellors and career mentors.',
    content: 'School and career counselling are growing disciplines across India. Aspiring counsellors require strong communication, empathy, and foundational training in psychology or management.',
    href: 'https://deekshaedu.in/career-as-cbse-school-counsellor-career-counsellor/',
    status: 'PUBLISHED'
  },
  {
    slug: 'top-trending-careers-india',
    category: 'Career',
    date: '11 Jun 2024',
    title: 'Top Trending Careers in India & How Much You Can Earn',
    summary: 'A deep dive into in-demand skills in AI, data analytics, digital business, and financial operations.',
    content: 'Emerging technology and digital commerce have created substantial demand for graduates with interdisciplinary skill sets spanning software, data analysis, and marketing.',
    href: 'https://deekshaedu.in/',
    status: 'PUBLISHED'
  },
  {
    slug: 'future-ready-education-criteria',
    category: 'Career',
    date: '01 May 2024',
    title: 'Future-Ready Education: 5 Criteria for Selecting a College or University',
    summary: 'What students and parents should look for when choosing an undergraduate degree institution.',
    content: 'Affiliation, practical curriculum, internship connections, mentorship, and career assistance are essential factors to consider before finalizing admission.',
    href: 'https://deekshaedu.in/future-ready-education-5-criteria-for-selecting-a-college-or-university-in-2024/',
    status: 'PUBLISHED'
  }
];

export const eventsSeed = [
  {
    slug: 'annual-academic-orientation-2026',
    title: 'Annual Academic Orientation & Industry Meet 2026',
    date: '15 Oct 2026',
    time: '10:00 AM - 04:00 PM',
    location: 'Deekshaam Campus Auditorium, Devanahalli, Bangalore',
    summary: 'Welcoming new undergraduate cohorts with talks by industry executives and academic deans.',
    description: 'A full-day orientation welcoming undergraduate students in BBA, BCA, and B.Com with keynote speakers from top Bangalore technology and business firms.',
    status: 'DRAFT'
  },
  {
    slug: 'ai-and-future-of-work-symposium',
    title: 'AI & The Future of Work Symposium',
    date: '02 Nov 2026',
    time: '11:00 AM - 02:00 PM',
    location: 'DBS Innovation Lab',
    summary: 'Hands-on symposium exploring generative AI applications in business and software engineering.',
    description: 'Faculty and student presentations on modern AI tools, automation in commerce, and emerging cloud infrastructure.',
    status: 'DRAFT'
  }
];

export const noticesSeed = [
  {
    title: 'Undergraduate Admissions Open for Academic Cycle 2026-27',
    date: '20 Sep 2026',
    priority: 'HIGH',
    fileUrl: '/documents/admissions_notification_2026.pdf',
    status: 'PUBLISHED'
  },
  {
    title: 'Submission of 10th and 12th Verification Documents for Enrolled Students',
    date: '10 Sep 2026',
    priority: 'NORMAL',
    fileUrl: '/documents/verification_guidelines.pdf',
    status: 'PUBLISHED'
  },
  {
    title: 'Campus Transport and Residential Hostel Facility Update',
    date: '01 Sep 2026',
    priority: 'NORMAL',
    fileUrl: '/documents/hostel_rules_2026.pdf',
    status: 'PUBLISHED'
  }
];

export const gallerySeed = [
  { title: 'Learning at Deekshaam', category: 'Campus', imageUrl: 'https://deekshaedu.in/wp-content/uploads/2025/03/Deekshaam-Buisness-School-Img-1.png', caption: 'A collage of classroom and student moments published by Deekshaam', order: 1, status: 'PUBLISHED' },
  { title: 'Computer applications', category: 'Illustration', imageUrl: 'https://deekshaedu.in/wp-content/uploads/2024/03/BCA.png', caption: 'Illustrative program image', order: 2, status: 'PUBLISHED' },
  { title: 'Business learning', category: 'Illustration', imageUrl: 'https://deekshaedu.in/wp-content/uploads/2024/03/2.png', caption: 'Illustrative program image', order: 3, status: 'PUBLISHED' },
  { title: 'Collaborative learning', category: 'Illustration', imageUrl: 'https://deekshaedu.in/wp-content/uploads/elementor/thumbs/arts-1-qlt7sxguf5drb2bhqpcmn8bgp7vsuhsk0s0x3a09zc.jpg', caption: 'Illustrative student image', order: 4, status: 'PUBLISHED' }
];

export const documentsSeed = [
  '10th standard marks card',
  '12th standard / Diploma marks card and completion certificate',
  'Passport-size photograph',
  'Application form',
  'Supporting affidavit where legally applicable for name / DOB change',
  'ABC ID as currently listed by the institution'
];
