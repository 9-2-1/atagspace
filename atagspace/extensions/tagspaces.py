# Do you know TagSpaces?
# https://www.tagspaces.org

# or, name your files in this format
# filename[tag1 tag2 tag3 ...].ext
# and that's it!

import re
from pathlib import Path
import logging
import json
from typing import Any
import uuid
import time

log = logging.getLogger(__name__)

from ..constants import TAG_TODO, TAG_AS_FILE, TAG_IGNORE, TAG_NOMOVE, DEFAULT_COLOR
from ..db import File
from .. import tagfile
from .. import category
from . import singlefilerename


def tagspaces_tags_get(file: Path) -> tuple[str, list[str]]:
    name = file.name
    realname = file.name
    tags: list[str] = []
    pattern = re.match(r"^\[(.*?)\](.*\[.*?\].*)$", name)
    if pattern:
        realname = pattern.group(2)
        tags = pattern.group(1).split(" ")
    else:
        pattern = re.match(r"^(.*)\[(.*?)\]((?:\.[0-9a-zA-Z_]{1,5}){,3})$", name)
        if pattern:
            realname = pattern.group(1) + pattern.group(3)
            tags = pattern.group(2).split(" ")
    if file.is_dir():
        tagfile = file / ".ts" / "tsm.json"
    else:
        tagfile = file.parent / ".ts" / (file.name + ".json")
    if tagfile.exists():
        try:
            with open(tagfile, "r", encoding="utf-8-sig") as f:
                tagjson = json.load(f)
                if "tags" in tagjson:
                    for tag in tagjson["tags"]:
                        tags.append(tag["title"])
        except Exception:
            log.warning(f"failed to read tagfile {tagfile}")

    tags = [tag.strip() for tag in tags if tag.strip() != ""]
    return realname, tags


def tagspaces_tags_apply_rename(realname: str, tags: list[str]) -> str:
    if len(tags) > 0:
        pattern = re.match(r"^(.*?)((?:\.[0-9a-zA-Z_]{1,5})?)$", realname)
        if not tags:
            return realname
        assert pattern is not None
        name, suffix = pattern.groups()
        pattern2 = re.match(r".*\[.*\]", name)
        if pattern2 is not None:
            return "[" + " ".join(tags) + "]" + name + suffix
        return name + "[" + " ".join(tags) + "]" + suffix
    else:
        return realname


def colored_tag(tag: str) -> Any:
    color = category.get_color(tag)
    ret: Any = {"title": tag}
    if color is None:
        return ret
    fg, bg = color.split("|")
    ret["color"] = bg
    ret["textcolor"] = fg
    return ret


def tagspaces_tags_apply_ts_json(
    file: Path, tags: list[str], dry_run: bool = False
) -> bool:
    if file.is_dir():
        tagfile = file / ".ts" / "tsm.json"
    else:
        tagfile = file.parent / ".ts" / (file.name + ".json")
    tagjson = {}
    if tagfile.exists():
        try:
            with open(tagfile, "r", encoding="utf-8-sig") as f:
                tagjson = json.load(f)
        except Exception:
            log.warning(f"failed to read tagfile {tagfile}")
    new_tags = [colored_tag(tag) for tag in tags]
    if tagjson.get("tags", []) != new_tags:
        tagjson["tags"] = new_tags
        if dry_run:
            log.info(f"would write tagfile {tagfile}")
            log.info(f"          with tags {new_tags}")
            return True
        else:
            log.info(f"Write tagfile {tagfile}")
            log.info(f"    with tags {new_tags}")
            try:
                tagfile.parent.mkdir(parents=True, exist_ok=True)
                with open(tagfile, "w", encoding="utf-8-sig") as f:
                    json.dump(tagjson, f, ensure_ascii=False, separators=(",", ":"))
                    return True
            except Exception:
                log.warning(f"failed to write tagfile {tagfile}")
    return False


def tag_has(file: File, tag: str) -> bool:
    return tag in file.tags.split(" ")


def tag_set(file: File, tag: str, set_: bool = True):
    if set_ != tag_has(file, tag):
        if set_:
            tagfile.tag_file_change(file.id, adds=[tag], removes=[])
        else:
            tagfile.tag_file_change(file.id, adds=[], removes=[tag])


def tagspaces_import(path: str) -> int:
    finish_count = 0

    def walk(path: str) -> None:
        nonlocal finish_count
        for file in tagfile.list_file(path, ""):
            path = tagfile.source_translate(file.path + file.name)
            realname, tags = tagspaces_tags_get(Path(path))
            tag_new = False
            for tag in tags:
                if not tag_has(file, tag):
                    tag_set(file, tag)
                    tag_new = True
            if tag_new:
                finish_count += 1
            if file.is_dir:
                walk(file.path + file.name)

    walk(path)
    return finish_count


BLOCKLIST: set[str] = set((TAG_TODO, TAG_AS_FILE, TAG_IGNORE, TAG_NOMOVE))


def tagspaces_export(path: str, dry_run: bool = False, singlefile: bool = False) -> int:
    finish_count = 0
    if singlefile:
        singlefilerename.init()

    def walk(path: str, nomove: bool = False) -> None:
        nonlocal finish_count
        for file in tagfile.list_file(path, ""):
            if file.is_dir:
                hasnomove = TAG_NOMOVE in file.tags.split(
                    " "
                ) or TAG_AS_FILE in file.tags.split(" ")
                walk(file.path + file.name, nomove or hasnomove)
            fpath = Path(tagfile.source_translate(file.path + file.name))
            new_tags = file.tags.split(" ")
            new_tags = [tag for tag in new_tags if tag not in BLOCKLIST and tag != ""]
            if nomove:
                if tagspaces_tags_apply_ts_json(fpath, new_tags, dry_run):
                    finish_count += 1
            else:
                newname = None
                if singlefile:
                    newname = singlefilerename.check_rename(file, new_tags)
                if newname is None:
                    realname, tags = tagspaces_tags_get(fpath)
                    newname = tagspaces_tags_apply_rename(realname, new_tags)
                if newname != file.name:
                    if dry_run:
                        log.info(f"would rename {fpath}")
                        log.info(f"          to {newname}")
                    else:
                        try:
                            log.info(f"rename {fpath}")
                            log.info(f"    to {newname}")
                            fpath.rename(fpath.with_name(newname))
                            tagfile.file_rename(file.id, newname)
                        except Exception:
                            log.warning(f"failed to rename {fpath} to {newname}")
                    finish_count += 1

    walk(path)
    return finish_count


def tagspaces_category_import(path: str) -> None:
    with open(path, "r", encoding="utf-8-sig") as f:
        tag_json = json.load(f)
    for cate in tag_json["tagGroups"]:
        category.set_category(cate["title"], cate["textcolor"] + "|" + cate["color"])
        for tag in cate["children"]:
            category.set_tag(tag["title"], cate["title"])
            category.set_tag_color(tag["title"], tag["textcolor"] + "|" + tag["color"])


def tagspaces_category_export(path: str) -> None:
    tag_json = {
        "appName": "atagspace",
        "appVersion": "6.6.4",
        "settingsVersion": 3,
        "tagGroups": [
            {
                "title": cate.name,
                "uuid": str(uuid.uuid4()),
                "children": [
                    {
                        "title": tag.name,
                        "color": category.get_color(tag.name).split("|")[1],
                        "textcolor": category.get_color(tag.name).split("|")[0],
                    }
                    for tag in category.list_tag(cate.name)
                ],
                "created_date": time.time(),
                "color": (
                    cate.color if cate.color is not None else DEFAULT_COLOR
                ).split("|")[1],
                "textcolor": (
                    cate.color if cate.color is not None else DEFAULT_COLOR
                ).split("|")[0],
                "modified_date": time.time(),
                "expanded": True,
            }
            for cate in category.list_category()
        ],
    }
    with open(path, "w", encoding="utf-8-sig") as f:
        json.dump(tag_json, f, ensure_ascii=False, indent=2)
