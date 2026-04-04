import { MdrAnnex1Service } from '@/services/mdrAnnex1Service';
import { toast } from 'sonner';

export async function insertMdrAnnex1Data() {
  const companyId = 'c27c10d3-bf22-4be2-a0de-931eb9286a7d';
  const productId = '92409f4c-44c1-4a3e-a0f0-e54206f06e68';

  const entries = [
    {
      mdr_annex_1_attribute: 'General Safety and Performance Requirements',
      chapter: 'CHAPTER I - GENERAL REQUIREMENTS',
      section: '',
      sub_section: '',
      gspr_clause: '1',
      detail: 'Devices must be safe, effective, suitable for their intended purpose, and have an acceptable benefit-risk ratio.',
      verify: 'Review the final RMF and CER to confirm the overall benefit-risk conclusion is positive.',
      responsible_party: 'QA/RA (P), R&D, Clinical',
      company_id: companyId,
      product_id: productId
    },
    {
      mdr_annex_1_attribute: 'Risk Reduction Requirements',
      chapter: 'CHAPTER I - GENERAL REQUIREMENTS',
      section: '',
      sub_section: '',
      gspr_clause: '2',
      detail: 'Reducing risk "as far as possible" means doing so without negatively impacting the benefit-risk ratio.',
      verify: 'Review the risk control option analysis and benefit-risk analysis within the RMF.',
      responsible_party: 'QA/RA (P), R&D, Clinical',
      company_id: companyId,
      product_id: productId
    },
    {
      mdr_annex_1_attribute: 'Risk Management System',
      chapter: 'CHAPTER I - GENERAL REQUIREMENTS',
      section: '',
      sub_section: '',
      gspr_clause: '3',
      detail: 'A risk management system must be established, implemented, and maintained as a continuous iterative process.',
      verify: 'Review the Risk Management Procedure and Risk Management Plan.',
      responsible_party: 'QA/RA (P), R&D',
      company_id: companyId,
      product_id: productId
    },
    {
      mdr_annex_1_attribute: 'Risk Management Plan',
      chapter: 'CHAPTER I - GENERAL REQUIREMENTS',
      section: '',
      sub_section: '',
      gspr_clause: '3(a)',
      detail: 'Establish and document a risk management plan for each device.',
      verify: 'Review the device-specific Risk Management Plan to confirm it is complete and approved.',
      responsible_party: 'QA/RA (P), R&D',
      company_id: companyId,
      product_id: productId
    },
    {
      mdr_annex_1_attribute: 'Hazard Identification and Analysis',
      chapter: 'CHAPTER I - GENERAL REQUIREMENTS',
      section: '',
      sub_section: '',
      gspr_clause: '3(b)',
      detail: 'Identify and analyse the known and foreseeable hazards associated with each device.',
      verify: 'Review the hazard analysis (e.g., FMEA, PHA) within the RMF.',
      responsible_party: 'R&D (P), QA/RA, Clinical',
      company_id: companyId,
      product_id: productId
    },
    {
      mdr_annex_1_attribute: 'Risk Estimation and Evaluation',
      chapter: 'CHAPTER I - GENERAL REQUIREMENTS',
      section: '',
      sub_section: '',
      gspr_clause: '3(c)',
      detail: 'Estimate and evaluate the risks associated with intended use and reasonably foreseeable misuse.',
      verify: 'Review the risk evaluation matrices and records within the RMF.',
      responsible_party: 'R&D (P), QA/RA, Clinical',
      company_id: companyId,
      product_id: productId
    },
    {
      mdr_annex_1_attribute: 'Risk Control',
      chapter: 'CHAPTER I - GENERAL REQUIREMENTS',
      section: '',
      sub_section: '',
      gspr_clause: '3(d)',
      detail: 'Eliminate or control risks in accordance with the requirements of Section 4.',
      verify: 'Review the risk control measures and their verification of effectiveness within the RMF.',
      responsible_party: 'R&D (P), QA/RA',
      company_id: companyId,
      product_id: productId
    },
    {
      mdr_annex_1_attribute: 'Post-Market Surveillance Impact Evaluation',
      chapter: 'CHAPTER I - GENERAL REQUIREMENTS',
      section: '',
      sub_section: '',
      gspr_clause: '3(e)',
      detail: 'Evaluate the impact of production and post-market surveillance (PMS) information on risks.',
      verify: 'Review the procedure linking the PMS system to the risk management system. Examine records of PMS data being used to update the RMF.',
      responsible_party: 'QA/RA (P), R&D, Clinical',
      company_id: companyId,
      product_id: productId
    },
    {
      mdr_annex_1_attribute: 'Risk Control Amendment',
      chapter: 'CHAPTER I - GENERAL REQUIREMENTS',
      section: '',
      sub_section: '',
      gspr_clause: '3(f)',
      detail: 'If necessary based on PMS data, amend risk control measures.',
      verify: 'Review updated versions of the RMF to confirm that PMS data has led to changes in risk controls where required.',
      responsible_party: 'QA/RA (P), R&D',
      company_id: companyId,
      product_id: productId
    }
  ];

  try {
    let successCount = 0;
    for (const entry of entries) {
      await MdrAnnex1Service.create(entry);
      successCount++;
    }
    toast.success(`Successfully inserted ${successCount} MDR Annex 1 entries`);
    return true;
  } catch (error) {
    console.error('Error inserting MDR Annex 1 data:', error);
    toast.error('Failed to insert MDR Annex 1 data');
    return false;
  }
}