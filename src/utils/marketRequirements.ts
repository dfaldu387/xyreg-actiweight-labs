
// EU member countries for determining if manufacturer is in EU
export const EU_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
  'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
  'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia',
  'Slovenia', 'Spain', 'Sweden'
];

// Check if a country is in the EU
export const isEUCountry = (country: string): boolean => {
  return EU_COUNTRIES.includes(country);
};

// Determine if an agent/AR is required based on manufacturer country and target market
export const isAgentRequired = (manufacturerCountry: string, marketCode: string): boolean => {
  const isManufacturerInEU = isEUCountry(manufacturerCountry);
  
  switch (marketCode) {
    case 'EU':
      // EU manufacturers don't need AR for EU market, but non-EU do
      return !isManufacturerInEU;
    case 'US':
    case 'USA':
      // All foreign manufacturers need US Agent
      return manufacturerCountry !== 'United States';
    case 'AU':
      // All foreign manufacturers need Australian Sponsor
      return manufacturerCountry !== 'Australia';
    case 'CA':
      // All foreign manufacturers need Canadian Importer
      return manufacturerCountry !== 'Canada';
    case 'JP':
      // All foreign manufacturers need Japan MAH
      return manufacturerCountry !== 'Japan';
    case 'CN':
      // All foreign manufacturers need China Legal Agent
      return manufacturerCountry !== 'China';
    case 'BR':
      // All foreign manufacturers need Brazilian Registration Holder
      return manufacturerCountry !== 'Brazil';
    case 'IN':
      // All manufacturers need import license for India
      return true;
    default:
      // Default to required for unknown markets
      return true;
  }
};

// Get explanatory message for why agent is required or optional
export const getAgentRequirementMessage = (manufacturerCountry: string, marketCode: string): string => {
  const isRequired = isAgentRequired(manufacturerCountry, marketCode);
  const isManufacturerInEU = isEUCountry(manufacturerCountry);
  
  switch (marketCode) {
    case 'EU':
      if (isManufacturerInEU) {
        return "As an EU manufacturer, an Authorized Representative is optional for EU markets";
      }
      return "Non-EU manufacturers must have an EU Authorized Representative";
    case 'US':
    case 'USA':
      if (manufacturerCountry === 'United States') {
        return "US manufacturers don't need a US Agent for US markets";
      }
      return "Foreign manufacturers must have a US Agent";
    case 'AU':
      if (manufacturerCountry === 'Australia') {
        return "Australian manufacturers don't need a Sponsor for Australian markets";
      }
      return "Foreign manufacturers must have an Australian Sponsor";
    case 'CA':
      if (manufacturerCountry === 'Canada') {
        return "Canadian manufacturers don't need an Importer for Canadian markets";
      }
      return "Foreign manufacturers must have a Canadian Importer";
    default:
      return isRequired ? "This agent/representative is required for this market" : "This agent/representative is optional for this market";
  }
};

// Get the agent type name for display
export const getAgentTypeName = (marketCode: string): string => {
  const agentTypes = {
    'EU': 'EU Authorized Representative',
    'US': 'US Agent',
    'USA': 'US Agent',
    'AU': 'Australian Sponsor',
    'CA': 'Canadian Importer',
    'JP': 'Marketing Authorization Holder (MAH)',
    'CN': 'China Legal Agent',
    'BR': 'Brazilian Registration Holder',
    'IN': 'Import License',
    'UK': 'UK Responsible Person',
    'CH': 'Swiss Authorized Representative',
    'KR': 'Korea Importer'
  };
  
  return agentTypes[marketCode] || 'Agent/Representative';
};
