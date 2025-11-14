from .db import Category, Tag, sqlite_db


def list_category() -> list[Category]:
    return list(Category.select())


def set_category(name: str, color: str | None) -> None:
    cate, new = Category.get_or_create(name=name)
    cate.color = color
    cate.save()


def rename_category(name: str, newname: str) -> None:
    Category.update(name=newname).where(Category.name == name).execute()


def list_tag() -> list[Category]:
    return list(Category.select())


def set_tag(name: str, cate: str) -> None:
    tag = Tag.get_or_none(name=name)
    if tag is not None:
        tag.cateid = Category.get(name=cate)
        tag.save()
    else:
        Tag.create(name=name, cateid=Category.get(name=cate))


def set_tag_color(name: str, color: str | None) -> None:
    Tag.update(color=color).where(Tag.name == name).execute()


@sqlite_db.atomic()
def remove_cate(name: str) -> None:
    cate = Category.get(name=name)
    Tag.delete().where(Tag.cateid == cate).execute()
    cate.delete_instance()


def remove_tag(name: str) -> None:
    Tag.delete().where(Tag.name == name).execute()


def get_color(name: str) -> str | None:
    tag = Tag.get_or_none(name=name)
    if tag:
        if tag.color is not None:
            return tag.color
        if tag.cateid.color is not None:
            return tag.cateid.color
    return Category.get(name="").color  # default
