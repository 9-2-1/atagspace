from .. import category
from .. import tagfile


def tags_key(tag: str) -> tuple[bool, str, str]:
    cate = category.get_category_name(tag)
    if cate is None:
        return (True, "", tag)
    return (False, cate, tag)


def sorttag(path: str) -> int:
    finish_count = 0

    def walk(path: str) -> None:
        nonlocal finish_count
        for file in tagfile.list_file(path, ""):
            tags = file.tags.split(" ")
            tags.sort(key=tags_key)
            sorted_tag = " ".join(tags)
            if sorted_tag != file.tags:
                tagfile.tag_file(file.id, tags)
                finish_count += 1
            if file.is_dir:
                walk((file.path + "/" if file.path != "" else "") + file.name)

    walk(path)
    return finish_count
