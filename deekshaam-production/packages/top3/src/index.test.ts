import { TopThreeEngine, Listing } from '../dist';

// --- Engine: exact matches return 3 picks ---
const engine = new TopThreeEngine({
  verticals: {
    job: {
      vertical: 'job',
      filterPriority: ['city', 'department', 'tag'],
      backfillOrder: ['program'],
      maxSponsoredSlots: 1,
    },
    program: {
      vertical: 'program',
      filterPriority: ['stream'],
      backfillOrder: [],
      maxSponsoredSlots: 0,
    },
  },
  listings: {
    job: [
      { id: 'j1', vertical: 'job', title: 'Job A', rankScore: 90, city: 'Bangalore', department: 'Technology' },
      { id: 'j2', vertical: 'job', title: 'Job B', rankScore: 85, city: 'Bangalore', department: 'Technology' },
      { id: 'j3', vertical: 'job', title: 'Job C', rankScore: 80, city: 'Bangalore', department: 'Finance' },
      { id: 'j4', vertical: 'job', title: 'Job D', rankScore: 75, city: 'Mumbai', department: 'Technology' },
      { id: 'j5', vertical: 'job', title: 'Job E', rankScore: 70, city: 'Bangalore', department: 'Technology' },
    ],
    program: [
      { id: 'p1', vertical: 'program', title: 'BBA', rankScore: 95, stream: 'Management' },
      { id: 'p2', vertical: 'program', title: 'BCA', rankScore: 90, stream: 'Technology' },
      { id: 'p3', vertical: 'program', title: 'B.Com', rankScore: 85, stream: 'Commerce' },
    ],
  },
});

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.error(`  ✗ ${name}`); failed++; }
}

// Test 1: Exact matches return exactly 3 picks
const r1 = engine.getTopThree('job', { city: 'Bangalore', department: 'Technology' });
assert(r1.picks.length === 3, 'Exact matches return exactly 3 picks');
assert(r1.picks[0].id === 'j1', 'Picks sorted by rankScore descending');
assert(r1.isBackfilled === false, 'No backfill when exact matches exist');
assert(r1.relaxedFilters.length === 0, 'No filters relaxed on exact match');

// Test 2: Filter relaxation kicks in when fewer than 3 exact matches
const r2 = engine.getTopThree('job', { city: 'Bangalore', department: 'Technology', tag: 'AI' });
assert(r2.picks.length === 3, 'Relaxation finds 3 picks when exact match is short');
assert(r2.relaxedFilters.includes('tag'), 'Relaxed the tag filter to reach 3 picks');
assert(r2.isBackfilled === false, 'Relaxation satisfies 3 picks without backfill');

// Test 3: Backfill across verticals when the vertical is exhausted
const engineBackfill = new TopThreeEngine({
  verticals: {
    niche: {
      vertical: 'niche',
      filterPriority: ['city'],
      backfillOrder: ['program'],
      maxSponsoredSlots: 0,
    },
    program: {
      vertical: 'program',
      filterPriority: ['stream'],
      backfillOrder: [],
      maxSponsoredSlots: 0,
    },
  },
  listings: {
    niche: [
      { id: 'n1', vertical: 'niche', title: 'Niche A', rankScore: 90, city: 'Mumbai' },
    ],
    program: [
      { id: 'p1', vertical: 'program', title: 'BBA', rankScore: 95, stream: 'Management' },
      { id: 'p2', vertical: 'program', title: 'BCA', rankScore: 90, stream: 'Technology' },
      { id: 'p3', vertical: 'program', title: 'B.Com', rankScore: 85, stream: 'Commerce' },
    ],
  },
});
const r3 = engineBackfill.getTopThree('niche', { city: 'Mumbai' });
assert(r3.picks.length === 3, 'Backfill reaches 3 picks');
assert(r3.isBackfilled === true, 'isBackfilled is true when cross-vertical picks used');
assert(r3.backfillVertical === 'program', 'backfillVertical indicates source vertical');

// Test 4: Sponsored rule — at most 1 sponsored pick
const engineWithSponsored = new TopThreeEngine({
  verticals: {
    test: {
      vertical: 'test',
      filterPriority: [],
      maxSponsoredSlots: 1,
    },
  },
  listings: {
    test: [
      { id: 's1', vertical: 'test', title: 'Sponsored High', rankScore: 100, isSponsored: true },
      { id: 'o1', vertical: 'test', title: 'Organic High', rankScore: 95 },
      { id: 's2', vertical: 'test', title: 'Sponsored Mid', rankScore: 90, isSponsored: true },
      { id: 'o2', vertical: 'test', title: 'Organic Mid', rankScore: 85 },
      { id: 'o3', vertical: 'test', title: 'Organic Low', rankScore: 80 },
    ],
  },
});
const r4 = engineWithSponsored.getTopThree('test');
const sponsoredCount = r4.picks.filter((p: Listing) => p.isSponsored).length;
assert(sponsoredCount <= 1, `At most 1 sponsored pick (got ${sponsoredCount})`);

// Test 5: Unknown vertical returns empty
const r5 = engine.getTopThree('nonexistent');
assert(r5.picks.length === 0, 'Unknown vertical returns empty picks');
assert(r5.isBackfilled === false, 'Unknown vertical has no backfill flag');

// Test 6: Fewer than 3 absolute last resort
const engineFew = new TopThreeEngine({
  verticals: {
    niche: {
      vertical: 'niche',
      filterPriority: [],
      backfillOrder: [],
      maxSponsoredSlots: 0,
    },
  },
  listings: {
    niche: [
      { id: 'n1', vertical: 'niche', title: 'Only One', rankScore: 50 },
      { id: 'n2', vertical: 'niche', title: 'Only Two', rankScore: 40 },
    ],
  },
});
const r6 = engineFew.getTopThree('niche');
assert(r6.picks.length === 2, 'Fewer than 3 when that is all that exists');
assert(r6.isBackfilled === false, 'Not backfilled when exhausted within vertical');

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
