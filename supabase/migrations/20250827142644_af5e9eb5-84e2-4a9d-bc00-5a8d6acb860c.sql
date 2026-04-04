-- Create some sample audit log data for testing purposes
-- First ensure we have a company to work with
DO $$
DECLARE
    test_company_id UUID;
    test_document_id UUID;
    test_user_id UUID;
BEGIN
    -- Get or create a test company
    SELECT id INTO test_company_id FROM companies LIMIT 1;
    IF test_company_id IS NULL THEN
        INSERT INTO companies (name, description) VALUES ('Test Company', 'A sample company for audit log testing')
        RETURNING id INTO test_company_id;
    END IF;
    
    -- Get or create a test document
    SELECT id INTO test_document_id FROM documents WHERE company_id = test_company_id LIMIT 1;
    IF test_document_id IS NULL THEN
        INSERT INTO documents (name, company_id, document_type, file_name, file_path)
        VALUES ('Test Document', test_company_id, 'Standard', 'test.pdf', '/test/test.pdf')
        RETURNING id INTO test_document_id;
    END IF;
    
    -- Get the super admin user ID
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'superadmin@gmail.com' LIMIT 1;
    
    -- Insert sample audit log entries if none exist
    IF NOT EXISTS (SELECT 1 FROM document_audit_logs LIMIT 1) THEN
        INSERT INTO document_audit_logs (
            document_id,
            user_id,
            company_id,
            action,
            action_details,
            ip_address,
            user_agent,
            metadata
        ) VALUES 
        (
            test_document_id,
            test_user_id,
            test_company_id,
            'view',
            '{"document_type": "Standard"}',
            '192.168.1.1',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            '{"test": "sample_audit_log"}'
        ),
        (
            test_document_id,
            test_user_id,
            test_company_id,
            'edit',
            '{"document_type": "Regulatory"}',
            '192.168.1.100',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            '{"test": "sample_audit_log_2"}'
        ),
        (
            test_document_id,
            test_user_id,
            test_company_id,
            'download',
            '{"file_size": "2MB"}',
            '10.0.0.50',
            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
            '{"test": "sample_audit_log_3"}'
        );
    END IF;
END $$;