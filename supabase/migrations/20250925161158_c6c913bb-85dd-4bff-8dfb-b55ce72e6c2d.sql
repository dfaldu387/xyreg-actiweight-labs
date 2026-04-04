-- Create 20 test users with random names and email addresses for the company

-- First, get the current company ID and use auth.uid() for current user
DO $$
DECLARE
    current_company_id uuid := '3f8646fd-cbf6-444c-af72-e2d05b11e4a1'; -- Nox Medical company ID
    test_user_data record;
    test_users text[][] := ARRAY[
        ['Emma Johnson', 'emma.johnson@noxmedical.com'],
        ['Michael Brown', 'michael.brown@noxmedical.com'],
        ['Sarah Davis', 'sarah.davis@noxmedical.com'],
        ['James Wilson', 'james.wilson@noxmedical.com'],
        ['Lisa Anderson', 'lisa.anderson@noxmedical.com'],
        ['David Taylor', 'david.taylor@noxmedical.com'],
        ['Jennifer Thomas', 'jennifer.thomas@noxmedical.com'],
        ['Robert Jackson', 'robert.jackson@noxmedical.com'],
        ['Ashley White', 'ashley.white@noxmedical.com'],
        ['Christopher Harris', 'christopher.harris@noxmedical.com'],
        ['Amanda Martin', 'amanda.martin@noxmedical.com'],
        ['Matthew Thompson', 'matthew.thompson@noxmedical.com'],
        ['Jessica Garcia', 'jessica.garcia@noxmedical.com'],
        ['Daniel Martinez', 'daniel.martinez@noxmedical.com'],
        ['Emily Robinson', 'emily.robinson@noxmedical.com'],
        ['Andrew Clark', 'andrew.clark@noxmedical.com'],
        ['Stephanie Rodriguez', 'stephanie.rodriguez@noxmedical.com'],
        ['Joshua Lewis', 'joshua.lewis@noxmedical.com'],
        ['Michelle Lee', 'michelle.lee@noxmedical.com'],
        ['Kevin Walker', 'kevin.walker@noxmedical.com']
    ];
    access_levels text[] := ARRAY['viewer', 'editor', 'admin']; -- Fixed to use correct values
    functional_areas text[] := ARRAY['Quality Assurance', 'Regulatory Affairs', 'R&D', 'Marketing', 'Sales', 'Manufacturing'];
    external_roles text[] := ARRAY['Quality Engineer', 'Regulatory Specialist', 'Product Manager', 'Sales Representative', 'Technical Consultant'];
BEGIN
    -- Insert test users into pending_company_users table
    FOR i IN 1..20 LOOP
        INSERT INTO public.pending_company_users (
            id,
            company_id,
            email,
            name,
            access_level,
            is_internal,
            functional_area,
            external_role,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            current_company_id,
            test_users[i][2], -- email
            test_users[i][1], -- name
            access_levels[((i - 1) % 3) + 1], -- rotate through access levels
            (i % 3) = 1, -- mix of internal/external users
            CASE WHEN (i % 3) = 1 THEN functional_areas[((i - 1) % 6) + 1] ELSE NULL END, -- functional area for internal users
            CASE WHEN (i % 3) != 1 THEN external_roles[((i - 1) % 5) + 1] ELSE NULL END, -- role for external users
            now(),
            now()
        );
        
        RAISE NOTICE 'Created test user: %', test_users[i][1];
    END LOOP;
    
    RAISE NOTICE 'Successfully created 20 test users for company %', current_company_id;
END $$;