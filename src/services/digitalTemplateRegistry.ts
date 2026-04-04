import { DesignReviewTemplateService } from './designReviewTemplateService';

export interface DigitalTemplateOption {
  id: string;
  name: string;
  description: string;
  activityTypes: string[];
  preview: () => any;
  generate: (phase?: string) => any;
}

export const digitalTemplateRegistry: DigitalTemplateOption[] = [
  {
    id: 'design_review',
    name: 'Design Review Template',
    description: 'Phase-adaptive design review template with structured sections for attendees, findings, and decisions',
    activityTypes: ['reviews_meetings'],
    preview: () => ({
      sections: DesignReviewTemplateService.getPhaseSpecificContent('concept')
    }),
    generate: (phase?: string) => DesignReviewTemplateService.generateTemplate(phase || 'concept')
  }
];

export const getDigitalTemplatesForActivityType = (activityType: string): DigitalTemplateOption[] => {
  return digitalTemplateRegistry.filter(template => 
    template.activityTypes.includes(activityType)
  );
};