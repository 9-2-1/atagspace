from .. import tagfile
from ..db import File


TAG_AS_FILE = "■"
TAG_TODO = "●"


def tag_has(file: File, tag: str) -> bool:
    return tag in file.tags.split(" ")


def tag_set(file: File, tag: str, set_: bool = True):
    if set_ != tag_has(file, tag):
        if set_:
            tagfile.tag_file_change(file.id, adds=[tag], removes=[])
        else:
            tagfile.tag_file_change(file.id, adds=[], removes=[tag])


def totag(path: str, markall: bool = False) -> tuple[int, int]:
    todo_count = 0
    finish_count = 0

    def walk(path: str) -> bool:
        nonlocal todo_count, finish_count
        sum_tag = False
        for file in tagfile.list_file(path, ""):
            if file.is_dir and not tag_has(file, TAG_AS_FILE):
                set_tag = walk((file.path + "/" if file.path != "" else "") + file.name)
                tag_set(file, TAG_TODO, set_tag)
                if set_tag:
                    sum_tag = True
            else:
                if markall:
                    tag_set(file, TAG_TODO)
                    todo_count += 1
                    sum_tag = True
                else:
                    if tag_has(file, TAG_TODO):
                        todo_count += 1
                        sum_tag = True
                    else:
                        finish_count += 1
        return sum_tag

    walk(path)
    return todo_count, finish_count
