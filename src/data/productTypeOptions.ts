import { Package, PackagePlus, GitBranch, Archive, Network } from "lucide-react";

export const PRODUCT_TYPE_OPTIONS = [
  {
    id: 'new_product',
    titleKey: 'deviceCreation.types.newDevice.title',
    descriptionKey: 'deviceCreation.types.newDevice.description',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'variant',
    titleKey: 'deviceCreation.types.variant.title',
    descriptionKey: 'deviceCreation.types.variant.description',
    icon: Network,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200'
  },
  {
    id: 'existing_product',
    titleKey: 'deviceCreation.types.deviceUpgrade.title',
    descriptionKey: 'deviceCreation.types.deviceUpgrade.description',
    icon: PackagePlus,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  {
    id: 'line_extension',
    titleKey: 'deviceCreation.types.lineExtension.title',
    descriptionKey: 'deviceCreation.types.lineExtension.description',
    icon: GitBranch,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200'
  },
  {
    id: 'legacy_product',
    titleKey: 'deviceCreation.types.legacyDevice.title',
    descriptionKey: 'deviceCreation.types.legacyDevice.description',
    icon: Archive,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  }
];

export const PROJECT_TYPES_BY_CATEGORY = {
  new_product: [
    'New Device Development (NDD)',
    'Technology Development / Research',
    'Feasibility Study'
  ],
  existing_product: [
    'Device Improvement / Feature Enhancement',
    'Component or Material Change',
    'Labeling or Packaging Change',
    'Software Update / Patch Release',
    'Cybersecurity Enhancement',
    'CAPA Implementation',
    'Compliance Remediation / Recertification',
    'Regulatory Submission (New Market)',
    'Manufacturing Process Change',
    'Production Site Transfer'
  ],
  line_extension: [
    'Line Extension'
  ],
  legacy_product: [
    'Legacy Device'
  ]
};
