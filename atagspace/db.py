import logging

# TODO: nopeewee
from peewee import (
    SqliteDatabase,
    Model,
    AutoField,
    TextField,
    IntegerField,
    DateTimeField,
    BooleanField,
    ForeignKeyField,
)

# logger = logging.getLogger("peewee")
# logger.addHandler(logging.StreamHandler())
# logger.setLevel(logging.DEBUG)

sqlite_db = SqliteDatabase(
    "atagspace.db",
    pragmas={"auto_vacuum": "full", "journal_mode": "wal", "synchronous": "normal"},
)


class BaseModel(Model):
    class Meta:
        database = sqlite_db


# tagfile
class Source(BaseModel):
    id = AutoField()
    name = TextField(unique=True, index=True)
    path = TextField()


class File(Model):
    id = AutoField()
    path = TextField()
    name = TextField()
    size = IntegerField(index=True)
    mtime = DateTimeField()
    dev = IntegerField(null=True)
    ino = IntegerField(null=True, index=True)
    checksum = TextField(null=True)
    is_dir = BooleanField()
    tags = TextField()
    deltime = DateTimeField(null=True)

    class Meta:
        database = sqlite_db
        indexes = ((("path", "name"), False),)


# checksum
class Checksum(Model):
    id = AutoField()
    path = TextField()
    size = IntegerField()
    mtime = DateTimeField()
    dev = IntegerField(null=True)
    ino = IntegerField(null=True)
    checksum = TextField()
    lasttime = DateTimeField()

    class Meta:
        database = sqlite_db
        indexes = ((("mtime", "size"), False),)


# category
class Category(BaseModel):
    id = AutoField()
    name = TextField(unique=True, index=True)
    color = TextField(null=True)


class Tag(BaseModel):
    id = AutoField()
    cateid = ForeignKeyField(Category, backref="tags")
    name = TextField(unique=True, index=True)
    color = TextField(null=True)


def init() -> None:
    sqlite_db.connect()
    sqlite_db.create_tables([Source, File, Checksum, Category, Tag])
    if Category.get_or_none(name="") is None:
        Category.create(name="", color="#c0c0c0|#ffffff")


def close() -> None:
    sqlite_db.close()
