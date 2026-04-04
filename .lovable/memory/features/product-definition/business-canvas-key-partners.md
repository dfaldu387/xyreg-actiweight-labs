# Memory: features/product-definition/business-canvas-key-partners

The **Key Partners** section in InvestorBusinessCanvas is dynamically derived via `deriveBusinessModelCanvas.ts`. It aggregates:

1. **Notified Body** (first, for EU markets) - Shows NB name and 4-digit number, or "Notified Body: Not defined" if EU market selected but no NB assigned
2. **Distribution Partners** - From `market.distributionPartners[]` structured array
3. **Clinical Partners** - From `market.clinicalPartners[]` structured array  
4. **Regulatory Partners** - From `market.regulatoryPartners[]` structured array

All partner data is pulled from `product.markets` JSONB (market-specific structured data), with fallback to legacy `product.strategic_partners` field only if no market-specific partners exist.

The completion criteria for the Genesis "Strategic Partners" step requires at least **2 partners** across any categories in selected markets.
