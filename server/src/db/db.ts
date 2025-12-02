import Database from 'better-sqlite3';
export const db = new Database('./data.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
process.on('SIGINT', () => {
  db.close();
});
