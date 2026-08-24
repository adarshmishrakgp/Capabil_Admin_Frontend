/**
 * Demo dataset. The panel runs entirely on this until NEXT_PUBLIC_USE_MOCK=false,
 * at which point `lib/api.ts` fetches the same shapes from the Node API.
 */

export const jobs = [
  {
    id: 'j1',
    title: 'Senior Data Engineer',
    slug: 'senior-data-engineer',
    department: 'Engineering',
    location: 'Bengaluru, IN',
    workMode: 'hybrid',
    employmentType: 'full_time',
    experience: '5–8 yrs',
    openings: 2,
    applications: 48,
    views: 1240,
    status: 'published',
    deadline: '2026-09-30',
    postedOn: '2026-08-04',
  },
  {
    id: 'j2',
    title: 'Capability Consultant — BFSI',
    slug: 'capability-consultant-bfsi',
    department: 'Delivery',
    location: 'Mumbai, IN',
    workMode: 'onsite',
    employmentType: 'full_time',
    experience: '8–12 yrs',
    openings: 1,
    applications: 21,
    views: 690,
    status: 'published',
    deadline: '2026-09-15',
    postedOn: '2026-07-28',
  },
  {
    id: 'j3',
    title: 'Product Designer',
    slug: 'product-designer',
    department: 'Engineering',
    location: 'Remote, IN',
    workMode: 'remote',
    employmentType: 'full_time',
    experience: '2–5 yrs',
    openings: 1,
    applications: 63,
    views: 2110,
    status: 'paused',
    deadline: '2026-09-05',
    postedOn: '2026-07-12',
  },
  {
    id: 'j4',
    title: 'Enterprise Sales Manager',
    slug: 'enterprise-sales-manager',
    department: 'Sales',
    location: 'Gurugram, IN',
    workMode: 'hybrid',
    employmentType: 'full_time',
    experience: '5–8 yrs',
    openings: 3,
    applications: 12,
    views: 305,
    status: 'draft',
    deadline: '2026-10-10',
    postedOn: '—',
  },
  {
    id: 'j5',
    title: 'HR Operations Intern',
    slug: 'hr-operations-intern',
    department: 'HR',
    location: 'Bengaluru, IN',
    workMode: 'onsite',
    employmentType: 'internship',
    experience: '0–2 yrs',
    openings: 2,
    applications: 96,
    views: 3400,
    status: 'closed',
    deadline: '2026-07-31',
    postedOn: '2026-06-18',
  },
];

export const applications = [
  { id: 'a1', ref: 'CAP-2026-000184', name: 'Ananya Rao', email: 'ananya.rao@mail.com', job: 'Senior Data Engineer', experience: '6 yrs', location: 'Bengaluru', status: 'shortlisted', rating: 4, appliedOn: '2026-08-21' },
  { id: 'a2', ref: 'CAP-2026-000183', name: 'Rohit Menon', email: 'rohit.menon@mail.com', job: 'Product Designer', experience: '4 yrs', location: 'Kochi', status: 'new', rating: 0, appliedOn: '2026-08-21' },
  { id: 'a3', ref: 'CAP-2026-000181', name: 'Sneha Kulkarni', email: 'sneha.k@mail.com', job: 'Capability Consultant — BFSI', experience: '9 yrs', location: 'Mumbai', status: 'interview', rating: 5, appliedOn: '2026-08-20' },
  { id: 'a4', ref: 'CAP-2026-000178', name: 'Imran Qureshi', email: 'imran.q@mail.com', job: 'Senior Data Engineer', experience: '7 yrs', location: 'Hyderabad', status: 'under_review', rating: 3, appliedOn: '2026-08-19' },
  { id: 'a5', ref: 'CAP-2026-000175', name: 'Divya Nair', email: 'divya.nair@mail.com', job: 'Product Designer', experience: '3 yrs', location: 'Remote', status: 'rejected', rating: 2, appliedOn: '2026-08-18' },
  { id: 'a6', ref: 'CAP-2026-000172', name: 'Karthik Iyer', email: 'karthik.iyer@mail.com', job: 'Senior Data Engineer', experience: '8 yrs', location: 'Chennai', status: 'selected', rating: 5, appliedOn: '2026-08-16' },
  { id: 'a7', ref: 'CAP-2026-000169', name: 'Priya Sharma', email: 'priya.sharma@mail.com', job: 'HR Operations Intern', experience: '1 yr', location: 'Bengaluru', status: 'hired', rating: 4, appliedOn: '2026-08-12' },
  { id: 'a8', ref: 'CAP-2026-000166', name: 'Vikram Desai', email: 'vikram.d@mail.com', job: 'Enterprise Sales Manager', experience: '11 yrs', location: 'Gurugram', status: 'on_hold', rating: 3, appliedOn: '2026-08-10' },
];

export const candidates = [
  { id: 'c1', name: 'Ananya Rao', email: 'ananya.rao@mail.com', phone: '+91 98450 11223', location: 'Bengaluru', experience: '6 yrs', skills: ['Spark', 'Airflow', 'dbt'], applications: 2, lastApplied: '2026-08-21' },
  { id: 'c2', name: 'Sneha Kulkarni', email: 'sneha.k@mail.com', phone: '+91 99870 44561', location: 'Mumbai', experience: '9 yrs', skills: ['BFSI', 'L&D Strategy'], applications: 3, lastApplied: '2026-08-20' },
  { id: 'c3', name: 'Karthik Iyer', email: 'karthik.iyer@mail.com', phone: '+91 90035 77219', location: 'Chennai', experience: '8 yrs', skills: ['Snowflake', 'Python'], applications: 1, lastApplied: '2026-08-16' },
  { id: 'c4', name: 'Divya Nair', email: 'divya.nair@mail.com', phone: '+91 97456 32180', location: 'Remote', experience: '3 yrs', skills: ['Figma', 'Design Systems'], applications: 2, lastApplied: '2026-08-18' },
  { id: 'c5', name: 'Vikram Desai', email: 'vikram.d@mail.com', phone: '+91 98110 65432', location: 'Gurugram', experience: '11 yrs', skills: ['Enterprise Sales', 'SaaS'], applications: 4, lastApplied: '2026-08-10' },
];

export const subscribers = [
  { id: 's1', email: 'asha.menon@acmecorp.com', status: 'confirmed', source: 'blog_sidebar', tags: ['insights'], joinedOn: '2026-08-21 09:14', confirmedOn: '2026-08-21 09:18' },
  { id: 's2', email: 'r.balan@fintrust.in', status: 'confirmed', source: 'footer', tags: ['bfsi'], joinedOn: '2026-08-20 17:02', confirmedOn: '2026-08-20 17:40' },
  { id: 's3', email: 'tanvi@growthlabs.io', status: 'pending', source: 'popup', tags: [], joinedOn: '2026-08-20 11:47', confirmedOn: null },
  { id: 's4', email: 'dev.k@northstar.com', status: 'confirmed', source: 'article_cta', tags: ['insights', 'playbooks'], joinedOn: '2026-08-19 08:31', confirmedOn: '2026-08-19 08:33' },
  { id: 's5', email: 'old.address@legacy.com', status: 'unsubscribed', source: 'import', tags: [], joinedOn: '2026-05-02 10:00', confirmedOn: '2026-05-02 10:12' },
  { id: 's6', email: 'bounce@invalid-domain.xyz', status: 'bounced', source: 'import', tags: [], joinedOn: '2026-04-14 15:20', confirmedOn: null },
];

/* charts */

export const applicationTrend = [12, 9, 14, 18, 11, 7, 5, 16, 22, 19, 14, 12, 9, 15, 21, 26, 18, 13, 10, 8, 17, 24, 29, 22, 16, 12, 14, 20, 27, 31];
export const subscriberTrend = [8, 11, 9, 14, 17, 12, 15, 19, 23, 21, 18, 24, 28, 26, 31, 35, 29, 33, 38, 41];

export const pipeline = [
  { stage: 'New', count: 42 },
  { stage: 'Under Review', count: 28 },
  { stage: 'Shortlisted', count: 17 },
  { stage: 'Interview', count: 9 },
  { stage: 'Selected', count: 4 },
  { stage: 'Hired', count: 2 },
];

export const topJobs = [
  { job: 'HR Operations Intern', count: 96 },
  { job: 'Product Designer', count: 63 },
  { job: 'Senior Data Engineer', count: 48 },
  { job: 'Capability Consultant', count: 21 },
  { job: 'Enterprise Sales Manager', count: 12 },
];
