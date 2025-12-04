import Database from 'better-sqlite3';

// 创建数据库连接
let db: Database.Database;

// 配置数据库
const DEFAULT_COLOR = '#ffffff';

// 初始化数据库连接
function initDb() {
  if (!db) {
    db = new Database('atagspace.db');
    db.pragma('auto_vacuum = FULL');
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
  }
  return db;
}

// 初始化数据库表
export function initDatabase() {
  const database = initDb();

  // Source表 - 源文件夹配置
  database.exec(`
    CREATE TABLE IF NOT EXISTS source (
      id INTEGER PRIMARY KEY,
      name TEXT,
      path TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS source_name ON source (name);
  `);

  // File表 - 文件信息和标签
  database.exec(`
    CREATE TABLE IF NOT EXISTS file (
      id INTEGER PRIMARY KEY,
      path TEXT,
      name TEXT,
      size INTEGER,
      mtime REAL,
      dev INTEGER,
      ino INTEGER,
      checksum TEXT,
      is_dir INTEGER,
      tags TEXT,
      deltime REAL
    );
    CREATE INDEX IF NOT EXISTS file_path_name ON file (path, name);
    CREATE INDEX IF NOT EXISTS file_dev_ino ON file (dev, ino);
    CREATE INDEX IF NOT EXISTS file_size_checksum ON file (size, checksum);
  `);

  // Checksum表 - 文件校验和缓存
  database.exec(`
    CREATE TABLE IF NOT EXISTS checksum (
      id INTEGER PRIMARY KEY,
      path TEXT,
      size INTEGER,
      mtime REAL,
      dev INTEGER,
      ino INTEGER,
      checksum TEXT,
      lasttime REAL
    );
    CREATE INDEX IF NOT EXISTS checksum_size_mtime ON checksum (size, mtime);
  `);

  // Category表 - 标签分类
  database.exec(`
    CREATE TABLE IF NOT EXISTS category (
      id INTEGER PRIMARY KEY,
      name TEXT,
      color TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS category_name ON category (name);
  `);

  // Tag表 - 标签信息
  database.exec(`
    CREATE TABLE IF NOT EXISTS tag (
      id INTEGER PRIMARY KEY,
      cate_id INTEGER,
      name TEXT,
      color TEXT,
      FOREIGN KEY (cate_id) REFERENCES category(id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS tag_name ON tag (name);
    CREATE INDEX IF NOT EXISTS tag_cate_id ON tag (cate_id);
  `);

  // MoveRule表 - 文件移动规则
  database.exec(`
    CREATE TABLE IF NOT EXISTS move_rule (
      id INTEGER PRIMARY KEY,
      name TEXT,
      conditions TEXT,
      target_path TEXT,
      enabled INTEGER DEFAULT 1
    );
  `);

  // 确保存在默认分类
  const defaultCate = database.prepare('SELECT 1 FROM category WHERE name = ?').get('');
  if (!defaultCate) {
    database.prepare('INSERT INTO category (name, color) VALUES (?, ?)').run('', DEFAULT_COLOR);
  }

  // 执行分析以优化查询
  database.exec('ANALYZE');
}

// 导出获取数据库连接的函数
// 使用类型断言避免返回无法命名的Database类型
export function getDb() {
  return initDb() as any;
}

export { DEFAULT_COLOR };
