import type { UserNeed } from '@/components/product/design-risk-controls/user-needs/types';

/**
 * Generates a formal User Needs Specification (URS) HTML document
 * from the stored user needs data, suitable for SaveContentAsDocCIDialog.
 */
export function generateUserNeedsURSHtml(
  userNeeds: UserNeed[],
  productName: string,
  companyName: string
): string {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Group by category
  const grouped: Record<string, UserNeed[]> = {};
  userNeeds.forEach((un) => {
    const cat = un.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(un);
  });

  const categories = Object.keys(grouped).sort();
  const metCount = userNeeds.filter((u) => u.status === 'Met').length;
  const notMetCount = userNeeds.filter((u) => u.status === 'Not Met').length;

  const tableStyle = `style="width:100%;border-collapse:collapse;margin-bottom:1.5em;font-size:13px"`;
  const thStyle = `style="border:1px solid #cbd5e1;padding:6px 10px;background:#f1f5f9;text-align:left;font-weight:600"`;
  const tdStyle = `style="border:1px solid #cbd5e1;padding:6px 10px;vertical-align:top"`;

  // Summary table
  const summaryRows = categories
    .map((cat) => {
      const items = grouped[cat];
      const met = items.filter((i) => i.status === 'Met').length;
      const notMet = items.filter((i) => i.status === 'Not Met').length;
      return `<tr><td ${tdStyle}>${cat}</td><td ${tdStyle}>${items.length}</td><td ${tdStyle}>${met}</td><td ${tdStyle}>${notMet}</td></tr>`;
    })
    .join('');

  // Per-category detail tables
  const categoryBlocks = categories
    .map((cat) => {
      const items = grouped[cat];
      const rows = items
        .map(
          (un) =>
            `<tr><td ${tdStyle}>${un.user_need_id}</td><td ${tdStyle}>${un.description}</td><td ${tdStyle}>${un.status}</td><td ${tdStyle}>${un.linked_requirements || '—'}</td></tr>`
        )
        .join('');
      return `
        <h3>${cat}</h3>
        <table ${tableStyle}>
          <thead><tr><th ${thStyle}>UN ID</th><th ${thStyle}>Description</th><th ${thStyle}>Status</th><th ${thStyle}>Linked Requirements</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    })
    .join('');

  return `
    <h1>User Needs Specification (URS)</h1>
    <table ${tableStyle}>
      <tbody>
        <tr><td ${tdStyle}><strong>Product</strong></td><td ${tdStyle}>${productName}</td></tr>
        <tr><td ${tdStyle}><strong>Company</strong></td><td ${tdStyle}>${companyName}</td></tr>
        <tr><td ${tdStyle}><strong>Date Generated</strong></td><td ${tdStyle}>${today}</td></tr>
        <tr><td ${tdStyle}><strong>Total User Needs</strong></td><td ${tdStyle}>${userNeeds.length}</td></tr>
        <tr><td ${tdStyle}><strong>Status</strong></td><td ${tdStyle}>Met: ${metCount} · Not Met: ${notMetCount}</td></tr>
      </tbody>
    </table>

    <h2>1. Summary by Category</h2>
    <table ${tableStyle}>
      <thead><tr><th ${thStyle}>Category</th><th ${thStyle}>Count</th><th ${thStyle}>Met</th><th ${thStyle}>Not Met</th></tr></thead>
      <tbody>${summaryRows}</tbody>
    </table>

    <h2>2. Detailed User Needs</h2>
    ${categoryBlocks}
  `;
}
