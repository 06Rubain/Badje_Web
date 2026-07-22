import Dexie from 'dexie';

export const db = new Dexie('BadgesDatabase');

db.version(1).stores({
  badges: '++id, program, firstName, lastName, createdAt, status' // status: 'pending', 'printed'
});

export const getBadges = async () => {
  return await db.badges.toArray();
};

export const clearAllBadges = async () => {
  return await db.badges.clear();
};
