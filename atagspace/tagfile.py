from datetime import datetime
from pathlib import Path
from dataclasses import dataclass
import re
import glob

from .db import sqlite_db, File, Source
from . import checker

from alive_progress import alive_bar, config_handler

config_handler.set_global(enrich_print=False, dual_line=True, length=10)


@dataclass
class ListFile:
    path: str
    name: str
    size: int
    mtime: datetime
    dev: int | None
    ino: int | None
    is_dir: bool


def tag_file(id_: int, tags: list[str]) -> None:
    File.update(tags=" ".join(tags)).where(File.id == id_).execute()


@sqlite_db.atomic()
def tag_file_change(id_: int, adds: list[str], removes: list[str]) -> None:
    file = File.get_by_id(id_)
    file.tags = " ".join([x for x in file.tags.split(" ") + adds if x not in removes])
    file.save()


def arglist(x: str) -> list[str]:
    quoted = False
    v = ""
    args: list[str] = []
    for i in x:
        if i == '"':
            quoted = not quoted
        if i == " " and not quoted:
            if v != "":
                args.append(v)
                v = ""
        else:
            v += i
    if v != "":
        args.append(v)
    return args


def apply_filter(filter_: str, file: File) -> bool:
    def test_filter(arg: str, disable_sym: bool = False) -> bool:
        if arg[0] == arg[-1] == '"':
            return test_filter(arg[1:-1], True)
        if disable_sym:
            if "*" in arg or "?" in arg or ("[" in arg and "]" in arg):
                regex = glob.translate(arg, recursive=True, include_hidden=True)
                if "/" in arg:
                    return (
                        re.match(regex, file.path + "/" + file.name, re.IGNORECASE)
                        is not None
                    )
                else:
                    return re.match(regex, file.name, re.IGNORECASE) is not None
            else:
                return arg in file.name
        else:
            if arg[0] == "+":
                return arg[1:] in file.tags.split(" ")
            elif arg[0] == "-":
                return arg[1:] not in file.tags.split(" ")
            elif arg[0] == "!":
                return not test_filter(arg[1:], True)
            else:
                return test_filter(arg, True)

    args = arglist(filter_)
    for arg in args:
        if not test_filter(arg):
            return False

    return True


def list_file(
    path: str, filter_: str, recurse: bool = False, limit: int = 1000
) -> list[File]:
    files = File.select().where(File.deltime.is_null(True))
    if not recurse:
        files = files.where(File.path == path)
    else:
        if path != "":
            files = files.where(
                (File.path == path) | (File.path.startswith(path + "/"))
            )
    files = files.order_by(File.path, File.name)
    filelist: list[File] = []
    for file in files:
        if apply_filter(filter_, file):
            if recurse and limit == 0:
                return filelist
            filelist.append(file)
            limit -= 1
    return filelist


def i64(x: int) -> int:
    x = x & 0xFFFFFFFFFFFFFFFF
    if x >= 0x8000000000000000:
        x -= 0x10000000000000000
    return x


def update_new(full: bool = False) -> None:
    # 1.update deltime
    File.update(deltime=datetime.now()).execute()
    filelist: list[ListFile] = []

    with alive_bar(title="List") as bar:

        def perfile(path: str, f: Path, is_dir: bool) -> None:
            bar.text(path + "/" + f.name)
            try:
                stat = f.lstat()
                filelist.append(
                    ListFile(
                        path=path,
                        name=f.name,
                        size=stat.st_size,
                        mtime=datetime.fromtimestamp(stat.st_mtime),
                        dev=i64(stat.st_dev),
                        ino=i64(stat.st_ino),
                        is_dir=is_dir,
                    )
                )
            except Exception as err:
                print(f"{path}: {err}")
            bar()

        for source in Source.select():
            root = Path(source.path)
            filelist.append(
                ListFile(
                    path="",
                    name=source.name,
                    size=0,
                    mtime=datetime.now(),
                    dev=None,
                    ino=None,
                    is_dir=True,
                )
            )
            bar()
            for p, ds, fs in root.walk():
                rela = p.relative_to(root)
                path = "/".join([source.name, *rela.parts])
                # filter ".xx's"
                ds[:] = [dn for dn in ds if dn[0] != "."]
                fs[:] = [fn for fn in fs if fn[0] != "."]
                for dn in ds:
                    perfile(path, p / dn, True)
                for fn in fs:
                    perfile(path, p / fn, False)

    def create_file(file: ListFile, checksum: str | None, tags: str = "") -> None:
        File.create(
            path=file.path,
            name=file.name,
            size=file.size,
            mtime=file.mtime,
            dev=file.dev,
            ino=file.ino,
            is_dir=file.is_dir,
            checksum=checksum,
            tags=tags,
            deltime=None,
        )

    def update_existing(existing: File, file: ListFile, checksum: str | None) -> None:
        existing.path = file.path
        existing.name = file.name
        existing.size = file.size
        existing.mtime = file.mtime
        existing.dev = file.dev
        existing.ino = file.ino
        existing.is_dir = file.is_dir
        existing.checksum = checksum
        existing.deltime = None
        existing.save()

    tocheck: list[ListFile] = []
    newcheck: list[ListFile] = []

    filelist2: list[ListFile] = []
    # 文件已经记录(path+name)？更新记录
    with alive_bar(len(filelist), title="Update") as bar:
        for file in filelist:
            bar.text(file.path + "/" + file.name)
            existing = File.get_or_none(path=file.path, name=file.name)
            if existing is not None:
                checksum = checker.check(file, cache_only=True)
                update_existing(existing, file, checksum)
                if not existing.is_dir and existing.checksum is None:
                    if full or existing.tags:
                        tocheck.append(existing)
            else:
                filelist2.append(file)
            bar()

    # 否则，查找相同的文件(dev+ino)
    filelist = filelist2
    filelist2 = []
    with alive_bar(len(filelist), title="Inode") as bar:
        for file in filelist:
            bar.text(file.path + "/" + file.name)
            existing = None
            if file.dev is not None and file.ino is not None:
                existing = File.get_or_none(File.dev == file.dev, File.ino == file.ino)
            if existing is not None:
                checksum = checker.check(file, cache_only=True)
                if existing.deltime is None:
                    print(
                        f"Copy: {existing.path}/{existing.name} -> {file.path}/{file.name}"
                    )
                    create_file(file, checksum, tags=existing.tags)
                else:
                    print(
                        f"Move: {existing.path}/{existing.name} -> {file.path}/{file.name}"
                    )
                    update_existing(existing, file, checksum)
                if not existing.is_dir and existing.checksum is None:
                    if full or existing.tags:
                        tocheck.append(existing)
            else:
                if file.is_dir:
                    create_file(file, None)
                else:
                    filelist2.append(file)
            bar()

    # 否则，查找相同的文件(size+checksum)
    filelist = filelist2
    with alive_bar(len(filelist), title="Size") as bar:
        for file in filelist:
            bar.text(file.path + "/" + file.name)
            existings = File.select().where(File.size == file.size)
            if not full:
                existings = existings.where(File.tags != "")
            checksum = checker.check(file, cache_only=True)
            if existings.exists() or full:
                if checksum is None:
                    newcheck.append(file)
                else:
                    existing = existings.where(File.checksum == checksum).get_or_none()
                    if existing is not None:
                        if existing.deltime is None:
                            print(
                                f"Copy: {existing.path}/{existing.name} -> {file.path}/{file.name}"
                            )
                            create_file(file, checksum, tags=existing.tags)
                        else:
                            print(
                                f"Move: {existing.path}/{existing.name} -> {file.path}/{file.name}"
                            )
                            update_existing(existing, file, checksum)
                    else:
                        create_file(file, checksum)
            else:
                create_file(file, checksum)
            bar()

    with alive_bar(
        sum(x.size for x in tocheck) + sum(x.size for x in newcheck),
        title="Sha256",
        unit="B",
        scale="SI",
    ) as bar:
        for file in tocheck:
            bar.text(file.path + "/" + file.name)
            existing = File.get(path=file.path, name=file.name)
            checksum = checker.check(file)
            update_existing(existing, file, checksum)
            bar(file.size)
        for file in newcheck:
            bar.text(file.path + "/" + file.name)
            try:
                checksum = checker.check(file)
            except Exception as err:
                print(f"{file}: {err}")
                continue
            existing = File.get_or_none(size=file.size, checksum=checksum)
            if existing is not None:
                if existing.deltime is None:
                    print(
                        f"Copy: {existing.path}/{existing.name} -> {file.path}/{file.name}"
                    )
                    create_file(file, checksum, tags=existing.tags)
                else:
                    print(
                        f"Move: {existing.path}/{existing.name} -> {file.path}/{file.name}"
                    )
                    update_existing(existing, file, checksum)
            else:
                create_file(file, checksum)
            bar(file.size)


@sqlite_db.atomic()
def update_src(path: str) -> None:
    Source.delete().execute()
    with open(path, "r", encoding="utf-8") as f:
        w = f.read().splitlines()
        for l in w:
            l = l.strip()
            if l.startswith("#"):
                continue
            name, path = l.split("|")
            Source.create(name=name, path=path)


def source_translate(path: str) -> str:
    parts = path.split("/")
    source = parts[0]
    srcpath = Source.get(Source.name == source)
    return str(Path(srcpath.path) / "/".join(parts[1:]))
