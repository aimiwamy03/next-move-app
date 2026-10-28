/**
 * Mock data for the demo. Marcus Reyes = Persona 2.
 * Swap these modules for real API clients later.
 */

export const marcusProfile = {
  firstName: 'Marcus',
  fullName: 'Marcus Anthony Reyes',
  dateOfBirthDisplay: 'Born Jan 9, 1988',
  county: 'Alameda County',
  countyShort: 'Alameda',
  phone: '5105550100',
  phoneDisplay: '(510) 555-0100',
  initials: 'M',
  // Demo "today" is Oct 25, 2026; release was Oct 20 → day 6 home.
  dayHome: 6,
};

/** Sample CF 285 answers from spec/samples/persona2-homeless-expedited.json */
export const marcusAnswers = {
  full_name: 'Marcus Anthony Reyes',
  date_of_birth: '01/09/1988',
  county: 'Alameda',
  sleeping_situation: 'shelter',
  home_address: 'No fixed address | Oakland | 94607',
  mailing_address: 'needs help',
  phone_number: '5105550100',
  ok_to_text: true,
  preferred_language: null,
  household_json: '[]',
  earned_income_month: 0,
  earned_income_details: null,
  other_income_month: 0,
  other_income_details: null,
  cash_and_bank: 40,
  housing_cost_month: 0,
  utilities: 'none',
  citizenship: 'yes',
  release_date: '10/20/2026',
  has_cal_id: 'no',
  has_medi_cal: 'unsure',
  has_ss_card: 'no',
  wants_medi_cal: true,
  ok_bfp_helper: true,
  call_outcome: 'confirmed',
} as const;

export const bfpHelper = {
  name: 'Jordan',
  role: 'BFP helper',
  hours: 'Weekdays, 10am to 4pm',
  phone: '9167474294',
  phoneDisplay: '(916) 747-4294',
};

export const resources = [
  {
    id: 'food',
    title: 'Food',
    subtitle: 'Free meals and groceries',
    route: '/resources/food' as const,
  },
  {
    id: 'housing',
    title: 'A place to stay',
    subtitle: 'Tonight and beyond',
    route: '/resources/housing' as const,
  },
  {
    id: 'id',
    title: 'ID & papers',
    subtitle: 'State ID, release papers, SS card',
    route: '/resources/id' as const,
  },
  {
    id: 'benefits',
    title: 'Benefits',
    subtitle: 'CalFresh, Medi-Cal, Social Security',
    route: '/resources/benefits' as const,
  },
  {
    id: 'health',
    title: 'Health care',
    subtitle: 'Meds and a clinic near you',
    route: '/resources/health' as const,
  },
  {
    id: 'officer',
    title: 'Your officer',
    subtitle: 'Parole or probation check-in',
    route: '/resources/officer' as const,
  },
];

export const foodPlaces = [
  {
    id: 'eastside',
    name: 'Eastside Community Kitchen',
    note: 'Sample place for the demo.',
    detail: 'Hot lunch every day, 11am to 1pm.',
    meta: '12 min walk. No ID needed.',
    phone: '5105550140',
  },
];

export const events = [
  {
    id: 'peer-walk',
    when: 'Saturday, 10am',
    title: 'Peer walk',
    place: 'Lake Merritt. Easy pace.',
  },
  {
    id: 'dinner-talk',
    when: 'Tuesday, 6pm',
    title: 'Dinner and talk',
    place: 'BFP office. Food provided.',
  },
];

export const announcements = [
  {
    id: 'a1',
    author: 'Rosa, BFP staff',
    initials: 'R',
    when: 'Today',
    body: 'The food pantry is open late this Friday, until 7pm.',
    thanks: 12,
  },
  {
    id: 'a2',
    author: 'Devon, BFP staff',
    initials: 'D',
    when: 'Yesterday',
    body: 'Free phone sign up is next Tuesday at the BFP office.',
    thanks: 8,
  },
];

export const reading = {
  title: 'Stone by stone',
  eyebrow: 'Evening read',
  minutesLeft: 4,
  paragraphs: [
    'On the trail, people stack small stones to say someone passed this way. No one builds the whole pile at once. You add one, and you keep walking.',
    'Today, one small stone is enough.',
  ],
};

export const callScriptQuestions = [
  'Who lives with you? Do you buy and cook food together?',
  'Where are you sleeping right now?',
  'How much money do you have right now?',
  'Do you have any money coming in this month?',
  'Is it okay if a helper from BFP calls you?',
];

export const formSteps = [
  {
    id: 'cash',
    question: 'How much money do you have right now?',
    hint: 'Cash plus any bank card. A guess is fine.',
    kind: 'money' as const,
    field: 'cash_and_bank',
  },
  {
    id: 'housing',
    question: 'Where are you sleeping right now?',
    hint: 'Pick the closest answer.',
    kind: 'options' as const,
    field: 'sleeping_situation',
    options: [
      { label: 'Shelter', value: 'shelter' },
      { label: 'Outside or in a vehicle', value: 'outside_or_vehicle' },
      { label: 'With family or friends', value: 'with_family_or_friends' },
      { label: 'My own place', value: 'own_place' },
    ],
  },
  {
    id: 'work',
    question: 'Any money from work this month?',
    hint: 'Before taxes. Zero is fine.',
    kind: 'money' as const,
    field: 'earned_income_month',
  },
];

export const expectSteps = [
  {
    title: 'Have these nearby',
    body: "Your ID, release papers and any pay stubs. It's okay if you don't have them.",
    icon: 'doc' as const,
  },
  {
    title: 'About 10 minutes',
    body: 'A friendly voice asks one question at a time. Take your time.',
    icon: 'clock' as const,
  },
  {
    title: "You're in charge",
    body: 'Say "skip" or "say that again." Or press I\'m overwhelmed anytime.',
    icon: 'hand' as const,
  },
  {
    title: 'Then you get a text',
    body: 'Open the link to check your form and sign with your finger.',
    icon: 'msg' as const,
  },
  {
    title: 'Then you review',
    body: 'In this demo you practice signing. Nothing is sent to the county from the app.',
    icon: 'send' as const,
  },
];

/** Check-in questions from calm designs (12a to 12e). */
export const dailyQuestions = [
  {
    id: 1,
    key: 'feeling',
    question: 'How are you feeling right now?',
    subtitle: 'There is no wrong answer.',
    multi: false,
    tiny: 'You can change this later.',
    options: [
      { title: 'Calm', subtitle: '' },
      { title: 'Okay', subtitle: '' },
      { title: 'Heavy', subtitle: '' },
    ],
  },
  {
    id: 2,
    key: 'sleep',
    question: 'How did you sleep?',
    subtitle: 'Rest matters on hard weeks.',
    multi: false,
    tiny: 'You can change this later.',
    options: [
      { title: 'Well', subtitle: 'I feel rested' },
      { title: 'Okay', subtitle: 'Some sleep' },
      { title: 'Not much', subtitle: 'It was a rough night' },
    ],
  },
  {
    id: 3,
    key: 'energy',
    question: 'How much energy do you have today?',
    subtitle: 'Your day adjusts to you.',
    multi: false,
    tiny: 'Low days count too.',
    options: [
      { title: 'A little', subtitle: 'Keep it small today' },
      { title: 'Some', subtitle: 'One move is enough' },
      { title: 'A lot', subtitle: 'Ready for more' },
    ],
  },
  {
    id: 4,
    key: 'weighing',
    question: 'Is anything weighing on you?',
    subtitle: 'Pick any. Or skip.',
    multi: true,
    tiny: '',
    options: [
      { title: 'Food', subtitle: '' },
      { title: 'Housing', subtitle: '' },
      { title: 'Money', subtitle: '' },
      { title: 'Parole or probation', subtitle: '' },
      { title: 'Family', subtitle: '' },
    ],
  },
  {
    id: 5,
    key: 'talk',
    question: 'Do you want to talk to a person today?',
    subtitle: 'A BFP helper can call you.',
    multi: false,
    tiny: 'You can ask anytime.',
    options: [
      { title: 'Yes, call me', subtitle: 'Today, when they can' },
      { title: 'Not today', subtitle: 'That is okay too' },
    ],
  },
] as const;

export const checkInQuestions = dailyQuestions;

/** Small steps (never frame as "get a job" to the user). */
export const lifeSteps = [
  {
    id: 'ss_card',
    title: 'Get your Social Security card',
    body: 'A helper can tell you where to go. Tap when you have it.',
    doneLabel: 'I have my card',
  },
  {
    id: 'bank_card',
    title: 'Get a bank card',
    body: 'A free debit card is fine. Tap when you have one.',
    doneLabel: 'I have a card',
  },
] as const;

/** Sample openings for the demo — not live postings. */
export const dummyJobs = [
  {
    id: 'warehouse-am',
    title: 'Warehouse helper',
    company: 'Bay Logistics Co.',
    place: 'Oakland, CA 94607',
    pay: '$18 an hour',
    when: 'Day shift · Starts next Monday',
    applyUrl: 'https://example.com/jobs/warehouse-helper',
  },
  {
    id: 'kitchen-lunch',
    title: 'Kitchen help',
    company: 'Eastside Community Kitchen',
    place: 'East Oakland, CA',
    pay: '$17 an hour',
    when: 'Lunch hours',
    applyUrl: 'https://example.com/jobs/kitchen-help',
  },
  {
    id: 'store-stock',
    title: 'Stock shelves',
    company: 'San Pablo Market',
    place: 'Near San Pablo Ave, Oakland',
    pay: '$16.50 an hour',
    when: 'Evening shift',
    applyUrl: 'https://example.com/jobs/stock-shelves',
  },
] as const;

export type HomeLayout = 'a' | 'b' | 'c' | 'd';
/** Default home direction from BUILD_PROMPT: option B */
export const DEFAULT_HOME_LAYOUT: HomeLayout = 'd';
