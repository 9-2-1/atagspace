from .db import Category, Tag


def list_category() -> list[Category]:
    return Category.list()


def set_category(name: str, color: str | None) -> None:
    Category.set(name, color)


def rename_category(name: str, newname: str) -> None:
    Category.rename(name, newname)


def list_tag(cate: str | None = None) -> list[Tag]:
    return Tag.list(cate)


def set_tag(name: str, cate: str) -> None:
    Tag.set(name, cate)


def set_tag_color(name: str, color: str | None) -> None:
    Tag.set_color(name, color)


def remove_cate(name: str) -> None:
    Category.remove(name)


def remove_tag(name: str) -> None:
    Tag.remove(name)


def get_color(name: str) -> str | None:
    return Tag.get_color(name)
