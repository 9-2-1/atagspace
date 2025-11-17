from pathlib import Path
from dataclasses import dataclass
import time
import re
import glob

from .db import File, Source
from . import checker

from alive_progress import alive_bar, config_handler

config_handler.set_global(enrich_print=False, dual_line=True, length=10)  # type: ignore


@dataclass
class ListFile:
    path: str
    name: str
    size: int
    mtime: float
    dev: int
    ino: int
    is_dir: bool


def tag_file(id_: int, tags: list[str]) -> None:
    File.tag(id_, " ".join(tags))


def tag_file_change(id_: int, adds: list[str], removes: list[str]) -> None:
    tags = File.get_tag(id_)
    tags = " ".join([x for x in tags.split(" ") + adds if x not in removes])
    File.tag(id_, tags)


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
    if recurse:
        files = File.list_recurse(path)
    else:
        files = File.list(path)
    files = [file for file in files if apply_filter(filter_, file)]
    if recurse and limit == 0:
        return files
    files = files[:limit]
    return files


def i64(x: int) -> int:
    x = x & 0xFFFFFFFFFFFFFFFF
    if x >= 0x8000000000000000:
        x -= 0x10000000000000000
    return x


def update_new(full: bool = False) -> None:
    # 1.update deltime
    File.mark_all_delete()
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
                        mtime=stat.st_mtime,
                        dev=i64(stat.st_dev),
                        ino=i64(stat.st_ino),
                        is_dir=is_dir,
                    )
                )
            except Exception as err:
                print(f"{path}: {err}")
            bar()

        for source in Source.list():
            root = Path(source.path)
            filelist.append(
                ListFile(
                    path="",
                    name=source.name,
                    size=0,
                    mtime=time.time(),
                    dev=0,
                    ino=0,
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
        File.add(
            path=file.path,
            name=file.name,
            size=file.size,
            mtime=file.mtime,
            dev=file.dev,
            ino=file.ino,
            is_dir=file.is_dir,
            checksum=checksum,
            tags=tags,
        )

    def update_existing(
        existing: File, file: ListFile | File, checksum: str | None
    ) -> None:
        existing.path = file.path
        existing.name = file.name
        existing.size = file.size
        existing.mtime = file.mtime
        existing.dev = file.dev
        existing.ino = file.ino
        existing.is_dir = file.is_dir
        existing.checksum = checksum
        existing.self_update()

    tocheck: list[ListFile | File] = []
    newcheck: list[ListFile] = []

    filelist2: list[ListFile] = []
    # 文件已经记录(path+name)？更新记录
    with alive_bar(len(filelist), title="Update") as bar:
        for file in filelist:
            bar.text(file.path + "/" + file.name)
            existing = File.reuse_get_path_name(file.path, file.name)
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
                existing = File.reuse_get_dev_ino(file.dev, file.ino)
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
            existings = File.reuse_list_size(file.size, full)
            checksum = checker.check(file, cache_only=True)
            if len(existings) > 0 or full:
                if checksum is None:
                    newcheck.append(file)
                else:
                    existing = next(
                        (x for x in existings if x.checksum == checksum), None
                    )
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
            existing = File.reuse_get_path_name(file.path, file.name)
            assert existing is not None
            checksum = checker.check(file)
            update_existing(existing, file, checksum)
            bar(file.size)
        for file in newcheck:
            bar.text(file.path + "/" + file.name)
            existing = None
            try:
                checksum = checker.check(file)
            except Exception as err:
                print(f"{file}: {err}")
                continue
            if checksum is None:
                continue
            existing = File.reuse_get_size_checksum(file.size, checksum)
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


def update_src(path: str) -> None:
    Source.clear()
    with open(path, "r", encoding="utf-8") as f:
        w = f.read().splitlines()
        for l in w:
            l = l.strip()
            if l.startswith("#"):
                continue
            name, path = l.split("|")
            Source.add(name, path)


def source_translate(path: str) -> str:
    parts = path.split("/")
    source = parts[0]
    srcpath = Source.get(source)
    return str(Path(srcpath) / "/".join(parts[1:]))
