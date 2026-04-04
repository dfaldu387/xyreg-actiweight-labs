import { supabase } from '@/integrations/supabase/client';

export interface ContentGenerationOptions {
  dateRange?: { start: string; end: string };
  markets?: string[];
  includeCharts?: boolean;
  detailLevel?: 'summary' | 'detailed';
}

export interface GeneratedContent {
  html: string;
  metadata: Record<string, any>;
}

// Generate Product Overview from products table
export async function generateProductOverview(
  productId: string,
  options: ContentGenerationOptions = {}
): Promise<GeneratedContent> {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error || !product) {
    throw new Error('Product not found');
  }

  const html = `
    <div class="product-overview">
      <h1>${product.name}</h1>
      <div class="section">
        <h2>Description</h2>
        <p>${product.description || 'N/A'}</p>
      </div>
      <div class="section">
        <h2>Intended Use</h2>
        <p>${product.intended_use || 'N/A'}</p>
      </div>
      <div class="section">
        <h2>Device Classification</h2>
        <p><strong>Category:</strong> ${product.device_category || 'N/A'}</p>
        <p><strong>Class:</strong> ${product.class || 'N/A'}</p>
      </div>
      <div class="section">
        <h2>Key Features</h2>
        <p>${product.key_features || 'N/A'}</p>
      </div>
    </div>
  `;

  return {
    html,
    metadata: {
      productId,
      generatedAt: new Date().toISOString(),
      productName: product.name,
    },
  };
}

// Generate Financial Summary from product_revenues
export async function generateFinancialSummary(
  productId: string,
  options: ContentGenerationOptions = {}
): Promise<GeneratedContent> {
  const { dateRange, markets } = options;

  let query = supabase
    .from('product_revenues')
    .select('*')
    .eq('product_id', productId);

  if (dateRange) {
    query = query
      .gte('period_start', dateRange.start)
      .lte('period_end', dateRange.end);
  }

  if (markets && markets.length > 0) {
    query = query.in('market_code', markets);
  }

  const { data: revenues, error } = await query.order('period_start', { ascending: false });

  if (error) throw error;

  const totalRevenue = revenues?.reduce((sum, r) => sum + (r.revenue_amount || 0), 0) || 0;
  const totalUnits = revenues?.reduce((sum, r) => sum + (r.units_sold || 0), 0) || 0;

  const html = `
    <div class="financial-summary">
      <h1>Financial Performance</h1>
      <div class="metrics">
        <div class="metric">
          <h3>Total Revenue</h3>
          <p class="value">$${totalRevenue.toLocaleString()}</p>
        </div>
        <div class="metric">
          <h3>Total Units Sold</h3>
          <p class="value">${totalUnits.toLocaleString()}</p>
        </div>
        <div class="metric">
          <h3>Markets</h3>
          <p class="value">${new Set(revenues?.map(r => r.market_code)).size}</p>
        </div>
      </div>
      <div class="section">
        <h2>Revenue by Period</h2>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Market</th>
              <th>Revenue</th>
              <th>Units</th>
            </tr>
          </thead>
          <tbody>
            ${revenues?.slice(0, 10).map(r => `
              <tr>
                <td>${r.period_start} to ${r.period_end}</td>
                <td>${r.market_code}</td>
                <td>$${(r.revenue_amount || 0).toLocaleString()}</td>
                <td>${(r.units_sold || 0).toLocaleString()}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No revenue data available</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return {
    html,
    metadata: {
      productId,
      generatedAt: new Date().toISOString(),
      totalRevenue,
      totalUnits,
      periodCount: revenues?.length || 0,
    },
  };
}

// Generate Regulatory Status from products.markets
export async function generateRegulatoryStatus(
  productId: string,
  options: ContentGenerationOptions = {}
): Promise<GeneratedContent> {
  const { data: product, error } = await supabase
    .from('products')
    .select('name, markets')
    .eq('id', productId)
    .single();

  if (error || !product) throw new Error('Product not found');

  const markets = (product.markets as any[]) || [];
  const { markets: filterMarkets } = options;

  const filteredMarkets = filterMarkets && filterMarkets.length > 0
    ? markets.filter(m => filterMarkets.includes(m.market_code))
    : markets;

  const html = `
    <div class="regulatory-status">
      <h1>Regulatory Status - ${product.name}</h1>
      <div class="section">
        <h2>Market Registrations</h2>
        <table>
          <thead>
            <tr>
              <th>Market</th>
              <th>Registration Number</th>
              <th>Risk Class</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMarkets.map(m => `
              <tr>
                <td>${m.market_code || 'N/A'}</td>
                <td>${m.registration_number || 'N/A'}</td>
                <td>${m.risk_class || 'N/A'}</td>
                <td>${m.registration_date || 'N/A'}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No market registrations available</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return {
    html,
    metadata: {
      productId,
      generatedAt: new Date().toISOString(),
      marketCount: filteredMarkets.length,
    },
  };
}

// Generate Clinical Evidence from clinical_trials
export async function generateClinicalEvidence(
  productId: string,
  options: ContentGenerationOptions = {}
): Promise<GeneratedContent> {
  const { data: trials, error } = await supabase
    .from('clinical_trials')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const html = `
    <div class="clinical-evidence">
      <h1>Clinical Evidence</h1>
      <div class="section">
        <h2>Clinical Trials Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Study Name</th>
              <th>Phase</th>
              <th>Status</th>
              <th>Primary Endpoint</th>
              <th>Enrollment</th>
            </tr>
          </thead>
          <tbody>
            ${trials?.map(t => `
              <tr>
                <td>${t.study_name}</td>
                <td>${t.study_phase}</td>
                <td>${t.status}</td>
                <td>${t.primary_endpoint || 'N/A'}</td>
                <td>${t.actual_enrollment || 0} / ${t.target_enrollment || 0}</td>
              </tr>
            `).join('') || '<tr><td colspan="5">No clinical trials data available</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return {
    html,
    metadata: {
      productId,
      generatedAt: new Date().toISOString(),
      trialCount: trials?.length || 0,
    },
  };
}

// Link to existing documents
export async function getExistingDocuments(
  productId: string,
  documentTypes?: string[]
): Promise<GeneratedContent> {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('product_id', productId);

  if (documentTypes && documentTypes.length > 0) {
    query = query.in('document_type', documentTypes);
  }

  const { data: documents, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  const html = `
    <div class="technical-documents">
      <h1>Technical Documentation</h1>
      <div class="section">
        <h2>Available Documents</h2>
        <ul class="document-list">
          ${documents?.map(d => `
            <li>
              <strong>${d.name}</strong>
              <span class="doc-meta">${d.document_type}</span>
            </li>
          `).join('') || '<li>No documents available</li>'}
        </ul>
      </div>
    </div>
  `;

  return {
    html,
    metadata: {
      productId,
      generatedAt: new Date().toISOString(),
      documentCount: documents?.length || 0,
      documentIds: documents?.map(d => d.id) || [],
    },
  };
}
