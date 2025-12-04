import { getDb } from '../index';

export interface MoveRule {
  id: number;
  name: string;
  conditions: string;
  target_path: string;
  enabled: boolean;
}

export const MoveRuleModel = {
  list: (): MoveRule[] => {
    const db = getDb();
    return db.prepare('SELECT * FROM move_rule')
      .all() as MoveRule[];
  },

  add: (name: string, conditions: string, targetPath: string, enabled: boolean = true): void => {
    const db = getDb();
    db.prepare(
      'INSERT INTO move_rule (name, conditions, target_path, enabled) VALUES (?, ?, ?, ?)'
    ).run(name, conditions, targetPath, enabled ? 1 : 0);
  },

  update: (id: number, name: string, conditions: string, targetPath: string, enabled: boolean): void => {
    const db = getDb();
    db.prepare(
      'UPDATE move_rule SET name = ?, conditions = ?, target_path = ?, enabled = ? WHERE id = ?'
    ).run(name, conditions, targetPath, enabled ? 1 : 0, id);
  },

  delete: (id: number): void => {
    const db = getDb();
    db.prepare('DELETE FROM move_rule WHERE id = ?')
      .run(id);
  },

  enable: (id: number, enabled: boolean): void => {
    const db = getDb();
    db.prepare('UPDATE move_rule SET enabled = ? WHERE id = ?')
      .run(enabled ? 1 : 0, id);
  }
};
