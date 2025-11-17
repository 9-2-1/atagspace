import sqlite3
import time
from dataclasses import dataclass

sqlite_db = sqlite3.connect("atagspace.db")
sqlite_db.execute("PRAGMA auto_vacuum = FULL;")
sqlite_db.execute("PRAGMA foreign_keys = ON;")
sqlite_db.execute("PRAGMA journal_mode = WAL;")
sqlite_db.execute("PRAGMA synchronous = NORMAL;")


# tagfile


@dataclass
class Source:
    id: int
    name: str
    path: str

    @staticmethod
    def init() -> None:
        sqlite_db.execute(
            "CREATE TABLE IF NOT EXISTS source ("
            " id INTEGER PRIMARY KEY,"
            " name TEXT,"
            " path TEXT)"
        )
        sqlite_db.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS source_name ON source (name)"
        )

    @staticmethod
    def list() -> list["Source"]:
        return [Source(*row) for row in sqlite_db.execute("SELECT * FROM source")]

    @staticmethod
    def add(name: str, path: str) -> None:
        sqlite_db.execute("INSERT INTO source (name, path) VALUES (?, ?)", (name, path))
        sqlite_db.commit()

    @staticmethod
    def get(name: str) -> str:
        return sqlite_db.execute(
            "SELECT path FROM source WHERE name = ?", (name,)
        ).fetchone()[0]

    @staticmethod
    def clear() -> None:
        sqlite_db.execute("DELETE FROM source")


@dataclass
class File:
    id: int
    path: str
    name: str
    size: int
    mtime: float
    dev: int
    ino: int
    checksum: str | None
    is_dir: bool
    tags: str
    deltime: float

    @staticmethod
    def init() -> None:
        sqlite_db.execute(
            "CREATE TABLE IF NOT EXISTS file ("
            " id INTEGER PRIMARY KEY,"
            " path TEXT,"
            " name TEXT,"
            " size INTEGER,"
            " mtime REAL,"
            " dev INTEGER,"
            " ino INTEGER,"
            " checksum TEXT,"
            " is_dir INTEGER,"
            " tags TEXT,"
            " deltime REAL)"
        )
        sqlite_db.execute(
            "CREATE INDEX IF NOT EXISTS file_path_name ON file (path, name)"
        )
        sqlite_db.execute("CREATE INDEX IF NOT EXISTS file_dev_ino ON file (dev, ino)")
        sqlite_db.execute(
            "CREATE INDEX IF NOT EXISTS file_size_checksum ON file (size, checksum)"
        )

    @staticmethod
    def tag(id_: int, tags: str) -> None:
        sqlite_db.execute("UPDATE file SET tags = ? WHERE id = ?", (tags, id_))
        sqlite_db.commit()

    @staticmethod
    def get_tag(id_: int) -> str:
        return sqlite_db.execute(
            "SELECT tags FROM file WHERE id = ?", (id_,)
        ).fetchone()[0]

    @staticmethod
    def list(path: str) -> list["File"]:
        return [
            File(*row)
            for row in sqlite_db.execute(
                "SELECT * FROM file WHERE path = ? AND deltime IS NULL ORDER BY name", (path,)
            )
        ]

    @staticmethod
    def list_recurse(path: str) -> "list[File]":
        if path == "":
            path_glob = "*"
        else:
            path_glob = path + "/*"
        return [
            File(*row)
            for row in sqlite_db.execute(
                "SELECT * FROM file WHERE (path == ? OR path GLOB ?) AND deltime IS NULL ORDER BY name",
                (path, path_glob),
            )
        ]

    @staticmethod
    def mark_all_delete() -> None:
        sqlite_db.execute(
            "UPDATE file SET deltime = ? WHERE deltime IS NULL", (time.time(),)
        )
        sqlite_db.commit()

    @staticmethod
    def add(
        path: str,
        name: str,
        size: int,
        mtime: float,
        dev: int,
        ino: int,
        checksum: str | None,
        is_dir: bool,
        tags: str,
    ) -> None:
        sqlite_db.execute(
            "INSERT INTO file (path, name, size, mtime, dev, ino, checksum, is_dir, tags, deltime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (path, name, size, mtime, dev, ino, checksum, is_dir, tags, None),
        )
        sqlite_db.commit()

    def self_update(self) -> None:
        sqlite_db.execute(
            "UPDATE file SET"
            " path = ?, name = ?, size = ?, mtime = ?, dev = ?, ino = ?, checksum = ?, is_dir = ?, tags = ?, deltime = ?"
            " WHERE id = ?",
            (
                self.path,
                self.name,
                self.size,
                self.mtime,
                self.dev,
                self.ino,
                self.checksum,
                self.is_dir,
                self.tags,
                None,
                self.id,
            ),
        )
        sqlite_db.commit()

    @staticmethod
    def reuse_get_path_name(path: str, name: str) -> "File | None":
        row = sqlite_db.execute(
            "SELECT * FROM file WHERE path = ? AND name = ?", (path, name)
        ).fetchone()
        return File(*row) if row is not None else None

    @staticmethod
    def reuse_get_dev_ino(dev: int, ino: int) -> "File | None":
        if ino == 0 or dev == 0:
            return None
        row = sqlite_db.execute(
            "SELECT * FROM file WHERE dev = ? AND ino = ?", (dev, ino)
        ).fetchone()
        return File(*row) if row is not None else None

    @staticmethod
    def reuse_list_size(size: int, include_notag: bool) -> "list[File]":
        return [
            File(*row)
            for row in sqlite_db.execute(
                "SELECT * FROM file WHERE size = ?"
                + (" AND tags != ''" if not include_notag else ""),
                (size,),
            )
        ]

    @staticmethod
    def reuse_get_size_checksum(size: int, checksum: str) -> "File|None":
        row = sqlite_db.execute(
            "SELECT * FROM file WHERE size = ? AND checksum = ?", (size, checksum)
        ).fetchone()
        return File(*row) if row is not None else None


# checksum
@dataclass
class Checksum:
    id: int
    path: str
    size: int
    mtime: float
    dev: int
    ino: int
    checksum: str
    lasttime: float

    @staticmethod
    def init() -> None:
        sqlite_db.execute(
            "CREATE TABLE IF NOT EXISTS checksum ("
            " id INTEGER PRIMARY KEY,"
            " path TEXT,"
            " size INTEGER,"
            " mtime REAL,"
            " dev INTEGER,"
            " ino INTEGER,"
            " checksum TEXT,"
            " lasttime REAL)"
        )
        sqlite_db.execute("CREATE INDEX IF NOT EXISTS checksum_path ON checksum (path)")
        sqlite_db.execute(
            "CREATE INDEX IF NOT EXISTS checksum_size_mtime ON checksum (size, mtime)"
        )
        sqlite_db.execute(
            "CREATE INDEX IF NOT EXISTS checksum_dev_ino ON checksum (dev, ino)"
        )

    @staticmethod
    def add(
        path: str, size: int, mtime: float, dev: int, ino: int, checksum: str
    ) -> None:
        sqlite_db.execute(
            "INSERT INTO checksum (path, size, mtime, dev, ino, checksum, lasttime)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (path, size, mtime, dev, ino, checksum, time.time()),
        )
        sqlite_db.commit()

    @staticmethod
    def reuse(
        size: int, mtime: float, path: str, dev: int, ino: int
    ) -> "Checksum | None":
        row = sqlite_db.execute(
            "SELECT * FROM checksum WHERE "
            " size = ? AND mtime = ? AND"
            " (path = ? OR (dev = ? AND ino = ? AND dev != 0 AND ino != 0))",
            (size, mtime, path, dev, ino),
        ).fetchone()
        return Checksum(*row) if row is not None else None

    def self_update_lasttime(self) -> None:
        sqlite_db.execute(
            "UPDATE checksum SET lasttime = ? WHERE id = ?", (time.time(), self.id)
        )
        sqlite_db.commit()


# category
@dataclass
class Category:
    id: int
    name: str
    color: str | None

    @staticmethod
    def init() -> None:
        sqlite_db.execute(
            "CREATE TABLE IF NOT EXISTS category ("
            " id INTEGER PRIMARY KEY,"
            " name TEXT,"
            " color TEXT)"
        )
        sqlite_db.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS category_name ON category (name)"
        )

    @staticmethod
    def list() -> list["Category"]:
        return [Category(*row) for row in sqlite_db.execute("SELECT * FROM category")]

    @staticmethod
    def set(name: str, color: str | None) -> None:
        sqlite_db.execute(
            "INSERT INTO category (name, color) VALUES (?1, ?2)"
            " ON CONFLICT(name) DO UPDATE SET color = ?2",
            (name, color),
        )
        sqlite_db.commit()

    @staticmethod
    def rename(name: str, newname: str) -> None:
        sqlite_db.execute(
            "UPDATE category SET name = ? WHERE name = ?", (newname, name)
        )
        sqlite_db.commit()

    @staticmethod
    def get_id(name: str) -> int:
        return sqlite_db.execute(
            "SELECT id FROM category WHERE name = ?", (name,)
        ).fetchone()[0]

    @staticmethod
    def remove(name: str) -> None:
        cate_id = Category.get_id(name)
        sqlite_db.execute("DELETE FROM tag WHERE cate_id = ?", (cate_id,))
        sqlite_db.execute("DELETE FROM category WHERE id = ?", (cate_id,))
        sqlite_db.commit()

    @staticmethod
    def get_color_id(id: int) -> str:
        query = sqlite_db.execute(
            "SELECT color FROM category WHERE id = ?", (id,)
        ).fetchone()
        if query is None:
            return "#c0c0c0|#ffffff"
        color = query[0]
        if color is None:
            return "#c0c0c0|#ffffff"
        return color


@dataclass
class Tag:
    id: int
    cate_id: int
    name: str
    color: str | None

    @staticmethod
    def init() -> None:
        sqlite_db.execute(
            "CREATE TABLE IF NOT EXISTS tag ("
            " id INTEGER PRIMARY KEY,"
            " cate_id INTEGER,"
            " name TEXT,"
            " color TEXT,"
            " FOREIGN KEY (cate_id) REFERENCES Category(id))"
        )
        sqlite_db.execute("CREATE UNIQUE INDEX IF NOT EXISTS tag_name ON tag (name)")
        sqlite_db.execute("CREATE INDEX IF NOT EXISTS tag_cate_id ON tag (cate_id)")

    @staticmethod
    def list(cate: str | None = None) -> list["Tag"]:
        if cate is None:
            return [Tag(*row) for row in sqlite_db.execute("SELECT * FROM tag")]
        cate_id = Category.get_id(cate)
        return [
            Tag(*row)
            for row in sqlite_db.execute(
                "SELECT * FROM tag WHERE cate_id = ?", (cate_id,)
            )
        ]

    @staticmethod
    def set(name: str, cate: str) -> None:
        cate_id = Category.get_id(cate)
        sqlite_db.execute(
            "INSERT INTO tag (name, cate_id) VALUES (?1, ?2)"
            " ON CONFLICT(name) DO UPDATE SET cate_id = ?2",
            (name, cate_id),
        )
        sqlite_db.commit()

    @staticmethod
    def set_color(name: str, color: str | None) -> None:
        sqlite_db.execute("UPDATE tag SET color = ? WHERE name = ?", (color, name))
        sqlite_db.commit()

    @staticmethod
    def remove(name: str) -> None:
        sqlite_db.execute("DELETE FROM tag WHERE name = ?", (name,))
        sqlite_db.commit()

    @staticmethod
    def get_color(name: str) -> str:
        query = sqlite_db.execute(
            "SELECT cate_id, color FROM tag WHERE name = ?", (name,)
        ).fetchone()
        if query is None:
            return Category.get_color_id(Category.get_id(""))
        cate_id, color = query
        if color is not None:
            return color
        return Category.get_color_id(cate_id)


def init() -> None:
    Source.init()
    File.init()
    Checksum.init()
    Category.init()
    Tag.init()
    try:
        Category.get_id("")
    except TypeError:
        Category.set("", "#c0c0c0|#ffffff")


def close() -> None:
    sqlite_db.close()
