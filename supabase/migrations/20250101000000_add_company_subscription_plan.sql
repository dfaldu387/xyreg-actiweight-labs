-- Add subscription_plan field to companies table
ALTER TABLE companies 
ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'Starter';

-- Add comment for the new column
COMMENT ON COLUMN companies.subscription_plan IS 'Current subscription plan for the company (Starter, Professional, Business, Enterprise)';

-- Update existing companies to have Starter plan by default
UPDATE companies 
SET subscription_plan = 'Starter' 
WHERE subscription_plan IS NULL; 