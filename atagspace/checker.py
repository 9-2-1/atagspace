from datetime import datetime
import hashlib

from .db import sqlite_db, Checksum
from . import tagfile  # circular!


def check(file: "tagfile.ListFile", cache_only: bool = False) -> str | None:
    if file.is_dir:
        return None
    realpath = tagfile.source_translate(file.path + "/" + file.name)
    existing = Checksum.get_or_none(
        (Checksum.size == file.size)
        & (Checksum.mtime == file.mtime)
        & (
            (Checksum.path == realpath)
            | (Checksum.dev == file.dev) & (Checksum.ino == file.ino)
        )
    )
    if existing is not None:
        existing.lasttime = datetime.now()
        existing.save()
        return existing.checksum
    else:
        if cache_only:
            return None
        with open(realpath, "rb") as f:
            digest = hashlib.file_digest(f, "sha256")
        Checksum.create(
            path=realpath,
            size=file.size,
            mtime=file.mtime,
            dev=file.dev,
            ino=file.ino,
            checksum=digest.hexdigest(),
            lasttime=datetime.now(),
        )
        return digest.hexdigest()
