-- Add the 2 missing ISO 13485 requirements to bring total to 65

-- Add requirement 8.3.1 for corrective action process establishment
INSERT INTO public.gap_analysis_templates (
    id,
    name,
    framework,
    description,
    importance,
    scope,
    is_active,
    is_custom,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'ISO 13485:2016 - Complete Set (65 Requirements)',
    'ISO 13485:2016',
    'Complete ISO 13485:2016 requirements with all 65 clauses',
    'high',
    'company',
    true,
    false,
    now(),
    now()
) ON CONFLICT DO NOTHING;

-- Get the template ID for ISO 13485
DO $$
DECLARE
    template_id_var uuid;
BEGIN
    SELECT id INTO template_id_var FROM public.gap_analysis_templates 
    WHERE framework = 'ISO 13485:2016' AND name LIKE '%Complete Set%' 
    LIMIT 1;
    
    -- Add missing requirement 8.3.1
    INSERT INTO public.gap_checklist_items (
        id,
        template_id,
        clause,
        section,
        requirement,
        description,
        category,
        framework,
        chapter,
        question_number,
        clause_description,
        evidence_method,
        audit_guidance,
        priority,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        template_id_var,
        '8.3.1',
        '8.3',
        'The organization shall establish a process for corrective action',
        'The organization shall establish a documented process for taking corrective action to eliminate the cause of nonconformities in order to prevent recurrence. The corrective action process shall include requirements for reviewing nonconformities, determining the causes of nonconformities, evaluating the need for action to ensure that nonconformities do not recur, determining and implementing action needed, records of the results of action taken, and reviewing corrective action taken.',
        'documentation',
        'ISO 13485:2016',
        '8',
        '8.3.1',
        'Process for corrective action establishment',
        'Review documented process, procedures, and implementation records',
        'Verify that a systematic process exists for identifying, investigating, and correcting nonconformities to prevent recurrence',
        'high',
        now(),
        now()
    );
    
    -- Add missing requirement 8.4.1  
    INSERT INTO public.gap_checklist_items (
        id,
        template_id,
        clause,
        section,
        requirement,
        description,
        category,
        framework,
        chapter,
        question_number,
        clause_description,
        evidence_method,
        audit_guidance,
        priority,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        template_id_var,
        '8.4.1',
        '8.4',
        'The organization shall establish a process for preventive action',
        'The organization shall establish a documented process for taking preventive action to eliminate the cause of potential nonconformities in order to prevent their occurrence. Preventive actions shall be appropriate to the effects of the potential problems. The preventive action process shall include requirements for determining potential nonconformities and their causes, evaluating the need for action to prevent occurrence of nonconformities, determining and implementing action needed, records of the results of action taken, and reviewing preventive action taken.',
        'documentation',
        'ISO 13485:2016',
        '8',
        '8.4.1',
        'Process for preventive action establishment',
        'Review documented process, procedures, and implementation records',
        'Verify that a systematic process exists for identifying and preventing potential nonconformities before they occur',
        'high',
        now(),
        now()
    );
END $$;