import hashlib

from .db import Checksum, File
from . import tagfile  # circular!


def check(file: "tagfile.ListFile|File", cache_only: bool = False) -> str | None:
    if file.is_dir:
        return None
    realpath = tagfile.source_translate(file.path + "/" + file.name)
    existing = Checksum.match(
        size=file.size, mtime=file.mtime, path=realpath, dev=file.dev, ino=file.ino
    )
    if existing is not None:
        existing.self_update_lasttime()
        return existing.checksum
    else:
        if cache_only:
            return None
        with open(realpath, "rb") as f:
            digest = hashlib.file_digest(f, "sha256")
        Checksum.add(
            path=realpath,
            size=file.size,
            mtime=file.mtime,
            dev=file.dev,
            ino=file.ino,
            checksum=digest.hexdigest(),
        )
        return digest.hexdigest()
