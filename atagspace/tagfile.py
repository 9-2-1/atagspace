from typing import TypeAlias
from pathlib import Path
from dataclasses import dataclass
import time
import re
import glob
import logging

from .db import File, Source, sqlite_db
from . import checker
from . import category
from .constants import TAG_TODO, TAG_AS_FILE

from alive_progress import alive_bar, config_handler

config_handler.set_global(enrich_print=False, dual_line=True, length=10)  # type: ignore

log = logging.getLogger(__name__)


@dataclass
class ListFile:
    path: str
    name: str
    size: int
    mtime: float
    dev: int
    ino: int
    is_dir: bool


def path_normalize(path: str) -> str:
    path_norm = path
    if path == "" or path_norm[0] != "/":
        path_norm = "/" + path_norm
    return path_norm


def tag_file(id_: int, tags: list[str]) -> None:
    File.set_tags(id_, " ".join(tags))


def tag_file_change(id_: int, adds: list[str], removes: list[str]) -> None:
    tags = File.get_tags(id_)
    tagl = list(filter(lambda x: x != "", tags.split(" ")))
    for tag in adds:
        if tag not in tagl:
            tagl.append(tag)
    tags = " ".join([x for x in tagl if x not in removes])
    File.set_tags(id_, tags)


# 类型定义说明
Condition: TypeAlias = "str | Expression"  # +aaa +bbb (*.bmp | *.png)
AndConditions = list[Condition]  # +aaa +bbb +ccc
OrConditions = list[AndConditions]  # ...|...|...
Expression = OrConditions


def arglist(x: str) -> Expression:
    """解析表达式字符串，返回结构化的Expression

    返回格式: list[list] - 外层list代表OrConditions，内层list代表AndConditions
    嵌套的list[list]表示括号内的子表达式
    """
    # 首先进行基础的空格分割，保留引号内的内容
    quoted = False
    v = ""
    tokens: list[str] = []
    for i in x:
        if i == '"':
            quoted = not quoted
            v += i
        elif i == " " and not quoted:
            if v != "":
                tokens.append(v)
                v = ""
        else:
            v += i
    if v != "":
        tokens.append(v)

    if len(tokens) == 0:
        return [[]]  # 这是有一个空的 AndConditions 的 OrConditions，代表匹配所有文件

    # 解析结构化表达式
    def parse_expression(
        tokens: list[str], start_idx: int = 0
    ) -> tuple[OrConditions, int]:
        """解析表达式，返回OrConditions结构和结束索引"""
        or_conditions: OrConditions = []
        and_conditions: AndConditions = []
        i = start_idx

        while i < len(tokens):
            token = tokens[i]

            # 处理左括号，递归解析子表达式
            if token == "(":
                # 找到匹配的右括号
                bracket_depth = 1
                j = i + 1
                while j < len(tokens) and bracket_depth > 0:
                    if tokens[j] == "(":
                        bracket_depth += 1
                    elif tokens[j] == ")":
                        bracket_depth -= 1
                    j += 1

                # 递归解析括号内的表达式
                if j <= len(tokens):
                    sub_expression, _ = parse_expression(tokens, i + 1)
                    # 检查是否有实际内容
                    if sub_expression and any(sub_expression):
                        and_conditions.append(sub_expression)
                i = j

            # 处理右括号，结束当前表达式解析
            elif token == ")":
                if and_conditions:
                    or_conditions.append(and_conditions)
                return or_conditions, i + 1

            # 处理或运算符
            elif token == "|":
                if and_conditions:
                    or_conditions.append(and_conditions)
                    and_conditions = []
                i += 1

            # 处理普通条件
            else:
                and_conditions.append(token)
                i += 1

        # 添加最后一组AND条件
        if and_conditions:
            or_conditions.append(and_conditions)

        return or_conditions, i

    # 解析整个表达式
    expression, _ = parse_expression(tokens)
    return expression


def evaluate_condition(
    cond: Condition, file: File
) -> tuple[bool, dict[str, list[str]]]:
    """
    评估单个条件

    参数:
    - cond: 条件，可以是字符串或嵌套表达式
    - file: 要过滤的文件对象

    返回:
    - tuple[bool, dict[str, list[str]]]: (是否匹配成功, 匹配的组)
    """
    # 如果是嵌套表达式（列表），调用evaluate_or_group
    if isinstance(cond, list):
        return evaluate_or_group(cond, file)
    # 否则是字符串条件，调用test_filter
    else:
        group_match: dict[str, list[str]] = {}
        result = test_filter(cond, file, group_match=group_match)
        return result, group_match


def evaluate_and_group(
    conditions: AndConditions, file: File
) -> tuple[bool, dict[str, list[str]]]:
    """
    评估AND条件组（所有条件必须满足）

    参数:
    - conditions: AND条件组
    - file: 要过滤的文件对象

    返回:
    - tuple[bool, dict[str, list[str]]]: (是否匹配成功, 匹配的组)
    """
    group_match: dict[str, list[str]] = {}

    for cond in conditions:
        result, sub_match = evaluate_condition(cond, file)
        if not result:
            return False, {}
        # 合并group_match
        for group, tags in sub_match.items():
            if group not in group_match:
                group_match[group] = []
            group_match[group].extend(tags)

    return True, group_match


def evaluate_or_group(
    expression: OrConditions, file: File
) -> tuple[bool, dict[str, list[str]]]:
    """
    评估OR条件组（任一AND条件组满足即可）

    参数:
    - expression: OR条件组
    - file: 要过滤的文件对象

    返回:
    - tuple[bool, dict[str, list[str]]]: (是否匹配成功, 匹配的组)
    """
    for and_group in expression:
        result, group_match = evaluate_and_group(and_group, file)
        if result:
            return True, group_match

    return False, {}


# 将apply_filter设置为evaluate_or_group的别名
apply_filter = evaluate_or_group


def test_filter(
    arg: str,
    file: File,
    disable_sym: bool = False,
    group_match: dict[str, list[str]] | None = None,
) -> bool:
    """
    测试单个条件是否满足

    参数:
    - arg: 条件字符串
    - file: 要测试的文件对象
    - disable_sym: 是否禁用特殊符号处理
    - group_match: 用于收集匹配的分类标签

    返回:
    - bool: 条件是否满足
    """
    if group_match is None:
        group_match = {}

    if arg[0] == arg[-1] == '"':
        return test_filter(arg[1:-1], file, True, group_match)

    if disable_sym:
        if "*" in arg or "?" in arg or ("[" in arg and "]" in arg):
            regex = glob.translate(arg, recursive=True, include_hidden=True)
            if "/" in arg:
                return re.match(regex, file.path + file.name, re.IGNORECASE) is not None
            else:
                return re.match(regex, file.name, re.IGNORECASE) is not None
        else:
            return arg.lower() in file.name.lower()
    else:
        if arg[0] == "+":
            return arg[1:] in file.tags.split(" ")
        elif arg[0] == "-":
            return arg[1:] not in file.tags.split(" ")
        elif arg[0] == "~":
            # in cate
            for tag in file.tags.split(" "):
                if category.get_category_name(tag) == arg[1:]:
                    group_match.setdefault(arg[1:], []).append(tag)
                    return True
            return False
        elif arg[0] == "!":
            return not test_filter(arg[1:], file, True, group_match)
        else:
            return test_filter(arg, file, True, group_match)


def has_normal_tag(tags: str) -> bool:
    return TAG_TODO not in tags.split(" ") and TAG_AS_FILE not in tags.split(" ")


def list_file(
    path: str,
    filter_: OrConditions | None = None,
    recurse: bool = False,
    limit: int = 1000,
) -> list[File]:
    path = path_normalize(path)
    if recurse:
        files = File.list_recurse(path)
    else:
        files = File.list(path)
    if filter_ is not None:
        files = [file for file in files if apply_filter(filter_, file)[0]]
    if not recurse or limit == 0:
        return files
    files = files[:limit]
    return files


def create_file(file: ListFile, checksum: str | None, tags: str = TAG_TODO) -> None:
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


def update_file_listfile(
    file: File, listfile: ListFile | File, checksum: str | None
) -> None:
    file.path = listfile.path
    file.name = listfile.name
    file.size = listfile.size
    file.mtime = listfile.mtime
    file.dev = listfile.dev
    file.ino = listfile.ino
    file.is_dir = listfile.is_dir
    file.checksum = checksum
    file.self_update()


def i64(x: int) -> int:
    x = x & 0xFFFFFFFFFFFFFFFF
    if x >= 0x8000000000000000:
        x -= 0x10000000000000000
    return x


def rename_file(id_: int, name: str) -> None:
    move_file(id_, None, name)


def move_file(id_: int, path: str | None, name: str | None) -> None:
    # create parent paths in database
    if path is not None:
        parts = [p for p in path.split("/") if p != ""]
        path = "/"
        for p in parts:
            if not File.exists(path=path, name=p):
                File.add(
                    path=path,
                    name=p,
                    size=0,
                    mtime=0,
                    dev=0,
                    ino=0,
                    is_dir=True,
                    checksum=None,
                    tags="",
                )
            path += p + "/"
    File.set_path_name(id_, path, name)


def update_new(full: bool = False) -> None:
    filelist: list[ListFile] = []

    with alive_bar(title="List") as bar:

        def perfile(path: str, f: Path, is_dir: bool) -> None:
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
                log.error(f"Error stat {path}: {err}")
            bar()

        for source in Source.list():
            root = Path(source.path)
            filelist.append(
                ListFile(
                    path="/",
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
                path = (
                    "/" + source.name + "/" + "".join(part + "/" for part in rela.parts)
                )
                bar.text(path)
                # filter ".xx's"
                ds[:] = [dn for dn in ds if dn[0] != "."]
                fs[:] = [fn for fn in fs if fn[0] != "."]
                for dn in ds:
                    perfile(path, p / dn, True)
                for fn in fs:
                    perfile(path, p / fn, False)

    tocheck: list[ListFile | File] = []
    newcheck: list[ListFile] = []

    filelist2: list[ListFile] = []
    # 这里设置事务锁住是为了防止看到只更新一半的文件
    with sqlite_db:
        File.mark_all_delete()
        # 文件已经记录(path+name)？更新记录
        with alive_bar(len(filelist), title="Update") as bar:
            for file in filelist:
                # bar.text(file.path + file.name)
                existing = File.reuse_get_path_name(file.path, file.name)
                if existing is not None:
                    checksum = checker.check(file, cache_only=True)
                    update_file_listfile(existing, file, checksum)
                    if not existing.is_dir and existing.checksum is None:
                        if full or has_normal_tag(existing.tags):
                            tocheck.append(existing)
                else:
                    filelist2.append(file)
                bar()

    # 否则，查找相同的文件(dev+ino)
    filelist = filelist2
    filelist2 = []
    with alive_bar(len(filelist), title="Inode") as bar:
        for file in filelist:
            # bar.text(file.path + file.name)
            existing = None
            if file.dev is not None and file.ino is not None:
                existing = File.reuse_get_dev_ino(file.dev, file.ino)
            if existing is not None:
                checksum = checker.check(file, cache_only=True)
                if existing.deltime is None:
                    log.info(f"Copy: {existing.path}{existing.name}")
                    log.info(f"   -> {file.path}{file.name}")
                    create_file(file, checksum, tags=existing.tags)
                else:
                    log.info(f"Move: {existing.path}{existing.name}")
                    log.info(f"   -> {file.path}{file.name}")
                    update_file_listfile(existing, file, checksum)
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
            # bar.text(file.path + file.name)
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
                            log.info(f"Copy: {existing.path}{existing.name}")
                            log.info(f"   -> {file.path}{file.name}")
                            create_file(file, checksum, tags=existing.tags)
                        else:
                            log.info(f"Move: {existing.path}{existing.name}")
                            log.info(f"   -> {file.path}{file.name}")
                            update_file_listfile(existing, file, checksum)
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
            bar.text(file.path + file.name)
            existing = File.reuse_get_path_name(file.path, file.name)
            assert existing is not None
            checksum = checker.check(file)
            update_file_listfile(existing, file, checksum)
            bar(file.size)
        for file in newcheck:
            bar.text(file.path + file.name)
            existing = None
            checksum = checker.check(file)
            if checksum is None:
                continue
            existing = File.reuse_get_size_checksum(file.size, checksum)
            if existing is not None:
                if existing.deltime is None:
                    log.info(f"Copy: {existing.path}{existing.name}")
                    log.info(f"   -> {file.path}{file.name}")
                    create_file(file, checksum, tags=existing.tags)
                else:
                    log.info(f"Move: {existing.path}{existing.name}")
                    log.info(f"   -> {file.path}{file.name}")
                    update_file_listfile(existing, file, checksum)
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
    path = path_normalize(path)
    parts = path.split("/")
    source = parts[1]
    srcpath = Source.get(source)
    return str(Path(srcpath) / "/".join(parts[2:]))
