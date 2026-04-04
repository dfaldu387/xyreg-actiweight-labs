-- Update the 4.1.2 requirement to match the correct process approach requirement
UPDATE gap_analysis_items 
SET requirement = 'Does the organization apply a process approach to the QMS? Are the processes and their interactions identified and documented?',
    section = '4.1.2 Process Approach'
WHERE clause_id = '4.1.2';