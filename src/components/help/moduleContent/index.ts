import { ModuleContent } from '@/types/onboarding';
import { clientCompassModule } from './clientCompassModule';
import { missionControlModule } from './missionControlModule';
import { productManagementModule } from './productManagementModule';
import { documentStudioModule } from './documentStudioModule';
import { complianceGapAnalysisModule } from './complianceGapAnalysisModule';
import { designRiskModule } from './designRiskModule';
import { businessAnalysisModule } from './businessAnalysisModule';
import { clinicalTrialsModule } from './clinicalTrialsModule';
import { fundingStagesModule } from './fundingStagesModule';
import { genesisGuideModule } from './genesisGuideModule';
import { platformGuideModule } from './platformGuideModule';

// Module content exports
export { 
  clientCompassModule,
  missionControlModule, 
  productManagementModule, 
  documentStudioModule,
  complianceGapAnalysisModule,
  designRiskModule,
  businessAnalysisModule,
  clinicalTrialsModule,
  fundingStagesModule,
  genesisGuideModule,
  platformGuideModule
};

// All modules registry
export const allModules: ModuleContent[] = [
  clientCompassModule,
  missionControlModule,
  productManagementModule,
  documentStudioModule,
  complianceGapAnalysisModule,
  designRiskModule,
  businessAnalysisModule,
  clinicalTrialsModule,
  fundingStagesModule,
  genesisGuideModule,
  platformGuideModule
];
