export const PILLARS = {
  sales: { key: 'sales', label: 'Sales', questionNumbers: [1, 2, 3] },
  operations: { key: 'operations', label: 'Operations', questionNumbers: [4, 5, 6] },
  finance: { key: 'finance', label: 'Finance', questionNumbers: [7, 8, 9] },
};

export const QUESTIONS = [
  {
    number: 1,
    pillar: 'sales',
    prompt: 'Do you know what percentage of enquiries convert into paying customers?',
    options: [
      "We don't track enquiries or conversions.",
      'We have a rough estimate, based on experience.',
      'We track enquiries and conversions periodically.',
      'We regularly track conversion rates and use them to improve sales.',
    ],
  },
  {
    number: 2,
    pillar: 'sales',
    prompt: "How consistently does your team follow up with potential customers who don't buy immediately?",
    options: [
      'There is no defined follow-up process.',
      'Follow-ups depend on individual employees or my availability.',
      'We follow up with most prospects, but the process is inconsistent.',
      'We have a defined follow-up process and track its results.',
    ],
  },
  {
    number: 3,
    pillar: 'sales',
    prompt: 'Do you know which channel brings you the most valuable customers?',
    options: [
      "We don't know where most customers come from.",
      'We have a rough idea from experience.',
      'We track leads or sales by acquisition channel.',
      'We compare channel costs, conversion and customer value.',
    ],
  },
  {
    number: 4,
    pillar: 'operations',
    prompt: 'If you were unavailable for seven days, how smoothly would your business operate?',
    options: [
      'Critical activities would stop or require my intervention.',
      'The team could manage some activities, but significant problems would arise.',
      'Most activities would continue, with a few bottlenecks.',
      'Documented processes and delegated decision-making allow operations to continue smoothly.',
    ],
  },
  {
    number: 5,
    pillar: 'operations',
    prompt: 'How consistently do employees follow the same process for recurring tasks?',
    options: [
      'Employees generally work in their own ways.',
      'Most processes depend on verbal instructions and individual experience.',
      'Important tasks have documented steps, but adherence varies.',
      'Key processes are documented, followed and periodically reviewed.',
    ],
  },
  {
    number: 6,
    pillar: 'operations',
    prompt: 'How do you measure employee performance?',
    options: [
      'Primarily through observation, complaints or intuition.',
      'We discuss performance informally, without clear targets.',
      'We set targets for some important roles and review them periodically.',
      'We use role-specific KPIs and regular performance reviews to address gaps.',
    ],
  },
  {
    number: 7,
    pillar: 'finance',
    prompt: 'Can you reliably state your monthly revenue, operating expenses and operating profit?',
    options: [
      'I cannot reliably access these figures.',
      "I know my revenue, but I don't have a clear picture of expenses and profit.",
      'I can access these figures from financial records.',
      'I review these figures regularly and compare them against targets or previous periods.',
    ],
  },
  {
    number: 8,
    pillar: 'finance',
    prompt: 'Do you know which products, services or customer segments generate the best margins?',
    options: [
      "No, we don't assess profitability at this level.",
      'We rely mainly on intuition or sales volume.',
      'We estimate margins for our major products or services.',
      'We review margins and use them to inform pricing and resource allocation.',
    ],
  },
  {
    number: 9,
    pillar: 'finance',
    prompt: 'How well can you forecast whether you will have enough cash to meet upcoming expenses?',
    options: [
      'We often discover cash shortages when payments are due.',
      'We check the bank balance and immediate expenses.',
      'We maintain a basic cash-flow forecast or upcoming payment schedule.',
      'We regularly forecast cash inflows, outflows and potential shortfalls.',
    ],
  },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;
