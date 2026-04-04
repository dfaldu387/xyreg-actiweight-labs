-- Fix existing records for Jane and Arnar: set is_internal and affiliation_type to match their invitations
UPDATE user_company_access SET is_internal = true, affiliation_type = 'internal'
WHERE company_id = 'fbcf54d2-e734-4f94-a8a9-38ccba0e0b91' 
AND user_id IN ('0d1329f5-781a-4388-a92d-3737a9fe0c14', 'a20582d6-0653-4eb7-a9a2-96635a61c6d1');