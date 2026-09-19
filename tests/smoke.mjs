import { home, programsPage, programDetail, certificationsPage, comparePage, admissionsPage, placementsPage, campusPage, aboutPage, resourcesPage, parentsPage, visitPage, contactPage, applyPage, trackPage } from '../src/pages/views.js';
import { institution, programs, employers, leaders } from '../src/data/content.js';

const checks = [
  ['institution', institution.name === 'Deekshaam Business School'],
  ['three UG programs', programs.length === 3],
  ['BBA route', programDetail('bba').includes('Bachelor of Business Administration')],
  ['BCA route', programDetail('bca').includes('Bachelor of Computer Applications')],
  ['BCom route', programDetail('bcom').includes('Bachelor of Commerce')],
  ['recruiter set', employers.length >= 8],
  ['leadership set', leaders.length >= 3 && leaders.every(x => x.image)],
  ['home', home().includes('Build the career')],
  ['programs', programsPage().includes('Undergraduate programs')],
  ['certifications', certificationsPage().includes('Professional certifications')],
  ['compare', comparePage().includes('Compare')],
  ['admissions', admissionsPage().includes('Admission')],
  ['placements', placementsPage().includes('Organizations where our students work')],
  ['campus', campusPage().includes('Campus life')],
  ['about', aboutPage().includes('Pushpa B')],
  ['resources', resourcesPage().includes('News')],
  ['parents', parentsPage().includes('For parents')],
  ['visit', visitPage().includes('Schedule visit')],
  ['contact', contactPage().includes(institution.admissionEmail)],
  ['application', applyPage().includes('Online application')],
  ['tracking', trackPage().includes('Application ID')],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (!ok) { failed++; console.error('FAIL', name); }
  else console.log('PASS', name);
}
if (failed) process.exit(1);
console.log(`\n${checks.length}/${checks.length} smoke checks passed.`);
