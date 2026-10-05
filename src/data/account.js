export const accountMenu = {
  label: 'Account menu',
  items: [
    { id: 'profile', href: '#/profile', label: 'Profile' },
    { id: 'settings', href: '#/settings', label: 'Settings' },
    { id: 'habits', href: '#/habits', label: 'Engineering habits' },
    { id: 'signout', action: 'logout', label: 'Sign out' },
  ],
};

export const profilePage = {
  eyebrowPrefix: 'Signed in as',
  title: 'Profile',
  lede: 'Your progress on this machine. Change your display name and backups from Settings.',
  settingsHref: '#/settings',
  settingsLabel: 'Open settings',
};

export const settingsPage = {
  eyebrow: 'Account',
  title: 'Settings',
  lede: 'Change the name the portal uses. Sign out when you leave this machine.',
  nameLabel: 'Display name',
  saveLabel: 'Save',
  signOutLabel: 'Sign out',
  backupsTitle: 'Local backups',
  backupsMilestone: 'M20',
  backups: 'Copy data/ and journal/ for a snapshot. Auth cookies stay on this machine. The API never evaluates learner code.',
};
