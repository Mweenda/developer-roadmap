export const gitWorkflow = {
  title: 'Git / engineering workflow',
  lede: 'Every project in this apprenticeship should move through a professional loop. Commits describe why the snapshot exists.',
  steps: [
    { id: 'repo', title: 'Create repository', detail: 'git init, add a README, make the first commit.' },
    { id: 'branch', title: 'Create a branch', detail: 'One branch per feature. Stay off main for unfinished work.' },
    { id: 'implement', title: 'Implement the feature', detail: 'Small steps. Run the program after each meaningful change.' },
    { id: 'commit', title: 'Commit', detail: 'Stage the files that belong together. Write a message that will make sense in six months.' },
    { id: 'test', title: 'Test', detail: 'Prove the change. Do not push hoping production will teach you.' },
    { id: 'review', title: 'Review', detail: 'Read your own diff. Then ask someone (or the journal) what is still vague.' },
    { id: 'merge', title: 'Merge', detail: 'Integrate to main only when the feature is done and explained.' },
  ],
  commits: [
    { example: 'feat: add task creation', why: 'A new capability the user can see.' },
    { example: 'fix: handle empty task titles', why: 'A defect with a specific cause.' },
    { example: 'test: add task validation tests', why: 'Evidence, not decoration.' },
    { example: 'refactor: extract task service', why: 'Same behaviour, clearer structure.' },
    { example: 'docs: update API documentation', why: 'The README is part of the product.' },
  ],
};
