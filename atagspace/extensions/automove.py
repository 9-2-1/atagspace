from pathlib import Path
import logging
import shutil
import stat

from ..constants import TAG_NOMOVE, TAG_IGNORE, TAG_AS_FILE, TAG_TODO
from .. import tagfile
from .unempty import rmtree_onexc

log = logging.getLogger(__name__)


def move_by_copy(src: str, dst: str) -> None:
    """
    通过复制文件，来移动文件
    """
    log.info(f"Move by copy: copying {src} to {dst}")
    shutil.copy2(src, dst)


def automove(
    path: str, moverule: str, dry_run: bool = True, mark_missed: bool = False
) -> int:
    """
    根据规则移动文件
    """
    moved_count = 0
    with open(moverule, "r", encoding="utf-8") as f:
        rules = f.readlines()
    rules_cooked: list[tuple[list[str] | None, str, str]] = []
    for rule in rules:
        rule = rule.strip()
        if rule == "" or rule.startswith("#"):
            continue
        filter_, dest = rule.split(" = ")
        filter_ = filter_.strip()
        dest = dest.strip()
        if dest[0] == '"' and dest[-1] == '"':
            dest = dest[1:-1]
        if dest[-1] != "/":
            dest += "/"
        filter_list = tagfile.arglist(filter_)
        rules_cooked.append((filter_list, dest, filter_))

    def walk(path: str) -> None:
        """
        递归遍历目录，根据规则移动文件
        """
        nonlocal moved_count
        for file in tagfile.list_file(path):
            tags = file.tags.split(" ")
            if TAG_NOMOVE in tags or TAG_IGNORE in tags:
                continue
            if file.is_dir and not TAG_AS_FILE in tags:
                walk(file.path + file.name)
            if TAG_TODO in tags:
                continue
            # 处理文件
            file_missed = True
            fpath = Path(tagfile.source_translate(file.path + file.name))
            for filter_list, dest, filter_ in rules_cooked:
                if filter_list is None:
                    matched = True
                    catetag = {}
                else:
                    matched, catetag = tagfile.apply_filter(filter_list, file)
                if not matched:
                    continue
                file_missed = False
                checked = True
                for cate, ctags in catetag.items():
                    if len(ctags) > 1:
                        # multiple tag exists, it is a mistake
                        if mark_missed:
                            if dry_run:
                                log.error(f"Would mark {file.path + file.name}")
                                log.error(f"        as TODO")
                                log.error(f"   (match) {filter_}")
                                log.error(f"    (tags) {cate}: {" ".join(ctags)}")
                                log.error("")
                            else:
                                log.error(f"   mark {file.path + file.name}")
                                log.error(f"     as TODO")
                                log.error(f"(match) {filter_}")
                                log.error(f" (tags) {cate}: {" ".join(ctags)}")
                                log.error("")
                                tagfile.tag_file_change(file.id, [TAG_TODO], [])
                        else:
                            log.error(f"Multiple tags:")
                            log.error(f" file {file.path + file.name}")
                            log.error(f" cate {cate}: ")
                            log.error(f" tags {" ".join(ctags)}")
                            log.error("")
                        checked = False
                        break
                    dest = dest.replace(f"{{{cate}}}", ctags[0])
                if checked and dest != file.path:
                    dpath = Path(tagfile.source_translate(dest + file.name))
                    moved_count += 1
                    if dry_run:
                        log.info(f"Would move {file.path + file.name}")
                        log.info(f"        to {dest + file.name}")
                        log.info(f"    (real) {fpath}")
                        log.info(f"      (to) {dpath}")
                        log.info(f"     match {filter_}")
                        log.info("")
                    else:
                        log.info(f"  move {file.path + file.name}")
                        log.info(f"    to {dest + file.name}")
                        log.info(f"(real) {fpath}")
                        log.info(f"  (to) {dpath}")
                        log.info(f" match {filter_}")
                        log.info("")
                        try:
                            if dpath.exists():
                                raise FileExistsError(f"file {dpath} already exists")
                            dpath.parent.mkdir(parents=True, exist_ok=True)
                            try:
                                fpath.rename(dpath)
                            except Exception as err:
                                # 这里的设计是，移动失败后尝试复制。即使复制后的清理失败，数据库照常更新。
                                log.info(f"Move by copy: ({err})")
                                if file.is_dir:
                                    shutil.copytree(
                                        fpath, dpath, copy_function=move_by_copy
                                    )
                                    try:
                                        shutil.rmtree(fpath, onexc=rmtree_onexc)
                                    except Exception as err:
                                        log.error(f"Failed to remove {fpath}: ({err})")
                                else:
                                    move_by_copy(str(fpath), str(dpath))
                                    try:
                                        fpath.chmod(
                                            stat.S_IWUSR
                                        )  # Add write permission
                                        fpath.unlink()
                                    except Exception as err:
                                        log.error(f"Failed to remove {fpath}: ({err})")
                            tagfile.move_file(file.id, dest, None)
                        except Exception as err:
                            log.error(f"Failed to move {fpath}: ({err})")
                break
            if file_missed and mark_missed:
                if dry_run:
                    log.error(f"Would mark {file.path + file.name}")
                    log.error(f"        as TODO")
                    log.error(f" all match missed")
                    log.error("")
                else:
                    log.error(f"   mark {file.path + file.name}")
                    log.error(f"     as TODO")
                    log.error(f" all match missed")
                    log.error("")
                    tagfile.tag_file_change(file.id, [TAG_TODO], [])

    walk(path)
    return moved_count
