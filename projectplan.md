## Investigate Foundation SOP reseed failure

### Todo
- [ ] Inspect the reseed/seed logic for Foundation SOPs and identify why missing numbers are skipped while duplicates remain
- [ ] Compare David Health Solutions Oy template source data vs Foundation Documents registry data for the affected SOPs
- [ ] Apply the smallest fix so reseed can restore missing SOPs without duplicating existing ones
- [ ] Add a review summary with the root cause and changes made

### Notes
- Focus only on David Health Solutions Oy Foundation SOP reseed behavior
- Keep the change as small as possible
