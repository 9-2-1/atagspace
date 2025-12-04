from pathlib import Path
from typing import Callable
import logging
import shutil
import os
import stat

from .. import tagfile
from ..db import File
from ..constants import TAG_AS_FILE, TAG_IGNORE, TAG_NOMOVE

log = logging.getLogger(__name__)


def rmtree_onexc(
    func: Callable[[str], None], path: str, exc_info: BaseException
) -> None:
    """
    Error handler for ``shutil.rmtree``.

    If the error is due to an access error (read-only file),
    attempts to add write permission and retries deletion.

    Usage: ``shutil.rmtree(path, onexc=rmtree_onexc)``
    """
    os.chmod(path, stat.S_IWUSR)  # Add write permission
    func(path)  # Retry deletion


def rmdir(file: File):
    rpath = Path(tagfile.source_translate(file.path + file.name))
    if (rpath / ".ts").exists():
        log.info(f"Removing .ts metadata: {rpath / '.ts'}")
        shutil.rmtree(rpath / ".ts", onexc=rmtree_onexc)
    if rpath.exists():
        log.info(f"Removing empty {rpath}")
        rpath.chmod(stat.S_IWUSR)  # Add write permission
        rpath.rmdir()
    File.mark_delete(file.path, file.name)


def unempty(path: str, dry_run: bool = False) -> int:
    finish_count = 0

    def walk(path: str) -> bool:
        nonlocal finish_count
        keep_file = False
        for file in tagfile.list_file(path):
            tags = file.tags.split(" ")
            if (
                file.is_dir
                and not TAG_AS_FILE in tags
                and not TAG_IGNORE in tags
                and not TAG_NOMOVE in tags
            ):
                has_file = walk(file.path + file.name)
                if not has_file:
                    log.info(f"Empty directory: {file.path + file.name}")
                    if not dry_run:
                        try:
                            rmdir(file)
                        except Exception as e:
                            log.error(
                                f"Error removing empty directory {file.path + file.name}: {e}"
                            )
                    finish_count += 1
                if has_file:
                    keep_file = True
            else:
                keep_file = True
        return keep_file

    walk(path)
    return finish_count
