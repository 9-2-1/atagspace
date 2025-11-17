# Do you know TagSpaces?
# https://www.tagspaces.org

# or, name your files in this format
# filename[tag1 tag2 tag3 ...].ext
# and that's it!

import traceback
import re
from pathlib import Path
import logging
import json

log = logging.getLogger(__name__)

from ..db import File
from .. import tagfile


def tagspaces_tags(file: Path) -> list[str]:
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
            traceback.print_exc()

    tags = [tag.strip() for tag in tags if tag.strip() != ""]
    return tags


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
            path = tagfile.source_translate(
                (file.path + "/" if file.path != "" else "") + file.name
            )
            tags = tagspaces_tags(Path(path))
            tag_new = False
            for tag in tags:
                if not tag_has(file, tag):
                    tag_set(file, tag)
                    tag_new = True
            if tag_new:
                finish_count += 1
            if file.is_dir:
                walk((file.path + "/" if file.path != "" else "") + file.name)

    walk(path)
    return finish_count
