// Demo data for the enterprise-integration preview (Confluence · Jira · ServiceNow).
// This is clearly-labelled SAMPLE data so the platform vision is demoable without
// live enterprise tenants. Real connectors would replace these with OAuth-scoped,
// permission-aware API reads. Shapes mirror each product's real REST payloads.

// ---- Confluence ----------------------------------------------------------
export const confluenceSpaces = [
  { key: 'SEC', name: 'Security & Compliance', color: '#2f5aa8' },
  { key: 'PAY', name: 'Payments Platform', color: '#0f766e' },
  { key: 'OPS', name: 'Operations Runbooks', color: '#b45309' },
];

export const confluencePages = [
  {
    id: 'cf-1', space: 'SEC', title: 'Vendor Payment Change Policy', updated: '2 days ago',
    author: 'Ravi Shah', labels: ['policy', 'payments'], topic: 'Operational Risk',
    excerpt: 'All vendor bank-detail changes must be verified by phone against a number already on file…',
    content:
      'Vendor Payment Change Policy\n\nAll changes to a vendor bank account must be verified by calling the vendor back on a phone number already held on file — never a number supplied in the request. Any urgent request to redirect a payment must be escalated to Finance Controls before funds move. Staff must never update payment details based solely on an email, even from a known contact.',
  },
  {
    id: 'cf-2', space: 'SEC', title: 'Data Handling & Client PII Standard', updated: '5 days ago',
    author: 'Daniel Park', labels: ['policy', 'privacy'], topic: 'Data Privacy',
    excerpt: 'Customer PII must never leave approved systems; exports require manager approval…',
    content:
      'Data Handling & Client PII Standard\n\nCustomer personal data must never be exported to personal email, messaging apps, or personal cloud storage. Any client-data export requires manager approval and must remain inside approved company systems. When sharing with a third party, use only the approved secure-transfer channel and share the minimum necessary.',
  },
  {
    id: 'cf-3', space: 'SEC', title: 'Phishing & MFA Response', updated: '1 week ago',
    author: 'Mina Alvarez', labels: ['policy', 'security'], topic: 'Cybersecurity',
    excerpt: 'Never share MFA codes or passwords — IT will never ask for them…',
    content:
      'Phishing & MFA Response\n\nEmployees must never share MFA codes, passwords, or one-time passcodes with anyone, including IT support. Treat urgent requests that pressure you to act before a deadline as suspicious, verify the sender through an official channel, and report suspected phishing immediately.',
  },
  {
    id: 'cf-4', space: 'OPS', title: 'Runbook: Payment Gateway Degradation', updated: '3 days ago',
    author: 'Jordan Lee', labels: ['runbook'], topic: 'Operational Risk',
    excerpt: 'Step 1: confirm scope in the gateway dashboard. Step 2: fail over to secondary region…',
    content:
      'Runbook: Payment Gateway Degradation\n\n1. Confirm scope in the gateway dashboard.\n2. Fail over to the secondary region if error rate > 2%.\n3. Notify Payments on-call and Finance Controls.\n4. Preserve logs and open a post-incident review.',
  },
  {
    id: 'cf-5', space: 'OPS', title: 'Runbook: Suspected Data Exfiltration', updated: '6 days ago',
    author: 'Mina Alvarez', labels: ['runbook'], topic: 'Data Privacy',
    excerpt: 'Contain the device, preserve evidence, then escalate to the SOC…',
    content:
      'Runbook: Suspected Data Exfiltration\n\n1. Isolate the affected device from the network.\n2. Preserve evidence (logs, screenshots) — do not wipe.\n3. Escalate to the SOC and Privacy Lead.\n4. Begin the breach-assessment checklist.',
  },
  {
    id: 'cf-6', space: 'PAY', title: 'Release Checklist — Payments', updated: 'today',
    author: 'Ava Chen', labels: ['process'], topic: 'Operational Risk',
    excerpt: 'Confirm env vars, run the health check, review known risks with the release manager…',
    content:
      'Release Checklist — Payments\n\n- Confirm environment variables are present.\n- Run the health check before onboarding the first user.\n- Review release notes and known risks with the release manager and platform lead.',
  },
];

// ---- Jira ----------------------------------------------------------------
export const jiraColumns = ['To Do', 'In Progress', 'In Review', 'Done'];

export const jiraIssues = [
  { key: 'PAY-1487', type: 'Bug', priority: 'Highest', summary: 'Duplicate settlement on retry for gateway timeouts', assignee: 'JL', status: 'In Progress', points: 5, sprint: 'Sprint 24' },
  { key: 'PAY-1490', type: 'Story', priority: 'High', summary: 'Add second-region failover to payment gateway', assignee: 'AC', status: 'In Progress', points: 8, sprint: 'Sprint 24' },
  { key: 'SEC-322', type: 'Task', priority: 'High', summary: 'Roll out phishing-response refresher to Payments team', assignee: 'MA', status: 'To Do', points: 3, sprint: 'Sprint 24' },
  { key: 'PAY-1492', type: 'Story', priority: 'Medium', summary: 'Vendor bank-change verification workflow', assignee: 'RS', status: 'To Do', points: 5, sprint: 'Sprint 24' },
  { key: 'OPS-210', type: 'Task', priority: 'Medium', summary: 'Update payment-gateway runbook for new dashboard', assignee: 'JL', status: 'In Review', points: 2, sprint: 'Sprint 24' },
  { key: 'SEC-318', type: 'Bug', priority: 'High', summary: 'PII export allowed to personal email in edge case', assignee: 'DP', status: 'In Review', points: 3, sprint: 'Sprint 24' },
  { key: 'PAY-1470', type: 'Story', priority: 'Medium', summary: 'Idempotency keys on settlement API', assignee: 'AC', status: 'Done', points: 5, sprint: 'Sprint 23' },
  { key: 'OPS-205', type: 'Task', priority: 'Low', summary: 'Archive deprecated gateway alerts', assignee: 'JL', status: 'Done', points: 1, sprint: 'Sprint 23' },
];

// ---- ServiceNow ----------------------------------------------------------
export const incidents = [
  {
    number: 'INC0048817', priority: 'P1', state: 'In Progress',
    short: 'Payment gateway elevated error rate in EU region',
    group: 'Payments On-Call', opened: '38m ago', slaMinsLeft: 22,
    category: 'Operational Risk', runbookId: 'cf-4', trainTopic: 'Operational Risk',
  },
  {
    number: 'INC0048820', priority: 'P2', state: 'New',
    short: 'Suspected phishing email reported by 3 staff in Ops',
    group: 'Security Operations', opened: '12m ago', slaMinsLeft: 108,
    category: 'Cybersecurity', runbookId: 'cf-3', trainTopic: 'Cybersecurity',
  },
  {
    number: 'INC0048809', priority: 'P2', state: 'On Hold',
    short: 'Client data export flagged to non-approved destination',
    group: 'Privacy & Data', opened: '1h 20m ago', slaMinsLeft: 55,
    category: 'Data Privacy', runbookId: 'cf-5', trainTopic: 'Data Privacy',
  },
  {
    number: 'INC0048795', priority: 'P3', state: 'In Progress',
    short: 'Vendor requested bank-detail change via email — unverified',
    group: 'Finance Controls', opened: '2h ago', slaMinsLeft: 240,
    category: 'Operational Risk', runbookId: 'cf-1', trainTopic: 'Operational Risk',
  },
  {
    number: 'INC0048780', priority: 'P4', state: 'New',
    short: 'Release checklist step skipped in staging deploy',
    group: 'Platform Engineering', opened: '3h ago', slaMinsLeft: 600,
    category: 'Operational Risk', runbookId: 'cf-6', trainTopic: 'Operational Risk',
  },
];

export const PRIORITY_META = {
  P1: { label: 'P1 · Critical', color: '#ef4444' },
  P2: { label: 'P2 · High', color: '#f59e0b' },
  P3: { label: 'P3 · Moderate', color: '#2f5aa8' },
  P4: { label: 'P4 · Low', color: '#64748b' },
};

export const pageById = (id) => confluencePages.find((p) => p.id === id);
