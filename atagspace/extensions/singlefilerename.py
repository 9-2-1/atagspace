from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional
import re
import html
import logging
import time

from dateparser import parse as datetime_parse

from .. import checker
from ..db import File, sqlite_db
from .. import tagfile


log = logging.getLogger(__name__)


def B2Q(uchar: str) -> str:
    """单个字符 半角转全角"""
    inside_code = ord(uchar)
    if inside_code < 0x0020 or inside_code > 0x7E:  # 不是半角字符就返回原来的字符
        return uchar
    if inside_code == 0x0020:  # 除了空格其他的全角半角的公式为: 半角 = 全角 - 0xfee0
        inside_code = 0x3000
    else:
        inside_code += 0xFEE0
    return chr(inside_code)


def name_by(orig: Path, title: str, url: str, tag: list[str], date: datetime) -> str:
    n_exten = orig.suffix
    date = date.astimezone(timezone(timedelta(hours=8)))
    n_date = date.strftime("%Y%m%d-%H%M%S")
    n_url = url
    for c in ["http://", "https://", "www."]:
        if n_url.startswith(c):
            n_url = n_url[len(c) :]
    if "/" in n_url:
        n_host = n_url[: n_url.find("/")]
    else:
        n_host = n_url
    if ":" in n_host:
        n_host_, n_port_ = n_host.split(":", 1)
        n_host_rev = ".".join(n_host_.split(".")[::-1]) + ":" + n_port_
    else:
        n_host_rev = ".".join(n_host.split(".")[::-1])
    n_title = title
    # zhihu.com
    n_title = re.sub(r"^\([0-9]+ 封私信\) ", "", n_title)
    n_title = re.sub(r"^\([0-9]+ 条消息\) ", "", n_title)
    n_title = re.sub(r"^\([0-9]+ 封私信 / [0-9]+ 条消息\) ", "", n_title)
    if len(n_title) > 80:
        n_title = n_title[:77] + "..."
    if len(n_url) > 80:
        n_url = n_url[:77] + "..."
    for c in r'/|\<>*?:"':
        n_title = n_title.replace(c, B2Q(c))
        n_url = n_url.replace(c, B2Q(c))
        n_host_rev = n_host_rev.replace(c, B2Q(c))
    for c in "\0\n\r":
        n_title = n_title.replace(c, "")
        n_url = n_url.replace(c, "")
        n_host_rev = n_host_rev.replace(c, "")
    n_tag = ""
    if len(tag) != 0:
        n_tag = "[" + " ".join(tag) + "]"
    name = f"{n_host_rev}【{n_title}】{n_date}〖{n_url}〗{n_tag}{n_exten}"
    return name


def title_parse(title: str) -> str:
    title = title.replace("=?utf-8?Q?", "").replace("?=", "")
    titleb = title.encode()
    titleb2 = b""
    i = 0
    while i < len(titleb):
        if titleb[i] == b"="[0]:
            b_high = b"0123456789ABCDEF".index(titleb[i + 1])
            b_low = b"0123456789ABCDEF".index(titleb[i + 2])
            b_code = b_high * 16 + b_low
            titleb2 += bytes((b_code,))
            i += 3
        else:
            titleb2 += bytes((titleb[i],))
            i += 1
    return titleb2.decode()


def parse_html(file: Path) -> tuple[str, str, datetime]:
    with open(file, "r", encoding="utf-8", errors="ignore") as fp:
        header = fp.read()
        # SingleFile header
        singlefile_begin = "<!--\n Page saved with SingleFile \n"
        singlefile_end = "\n-->"
        title_begin = "<title"
        title_begin_2 = ">"
        title_end = "</title>"
        singlefile_left = header.index(singlefile_begin, 0) + len(singlefile_begin)
        singlefile_right = header.index(singlefile_end, singlefile_left)
        title_left = header.index(
            title_begin, singlefile_right + len(singlefile_end)
        ) + len(title_begin)
        title_left = header.index(title_begin_2, title_left) + len(title_begin_2)
        title_right = header.index(title_end, title_left)
        singlefile = header[singlefile_left:singlefile_right]
        title = html.unescape(header[title_left:title_right])
        singlefile_dict = {}
        for line in singlefile.split("\n"):
            key, value = line.split(":", 1)
            key = key.strip()
            value = value.strip()
            singlefile_dict[key] = value
        title = title
        url = singlefile_dict["url"]
        date = datetime_parse(singlefile_dict["saved date"])
        assert date is not None
    return title, url, date


def parse_mhtml(file: Path) -> tuple[str, str, datetime]:
    with open(file, "r", encoding="utf-8", errors="ignore") as fp:
        header = fp.read()
        header_end = "\n\n"
        header_right = header.index(header_end, 0)
        header = header[0:header_right]
        mhtml_dict = {}
        key = ""
        for line in header.split("\n"):
            if ":" in line:
                key, value = line.split(":", 1)
                key = key.strip()
                value = value.strip()
                mhtml_dict[key] = value
            else:
                value = line.strip()
                mhtml_dict[key] += value
        title = title_parse(mhtml_dict["Subject"])
        url = mhtml_dict["Snapshot-Content-Location"]
        date = datetime_parse(mhtml_dict["Date"])
        assert date is not None
    return title, url, date


def parse_file(file: Path) -> Optional[tuple[str, str, datetime]]:
    if file.suffix == ".html":
        try:
            return parse_html(file)
        except Exception:
            log.warning(f"process {file} Failed")
    elif file.suffix == ".mhtml":
        try:
            return parse_mhtml(file)
        except Exception:
            log.warning(f"process {file} Failed")
    return None


def init() -> None:
    sqlite_db.execute(
        "CREATE TABLE IF NOT EXISTS singlefile (id INTEGER PRIMARY KEY, checksum TEXT, title TEXT, url TEXT, date TEXT, lasttime REAL)"
    )
    sqlite_db.execute(
        "CREATE INDEX IF NOT EXISTS singlefile_checksum ON singlefile (checksum)"
    )
    sqlite_db.commit()


def parse_file_cached(file: File) -> Optional[tuple[str, str, datetime]]:
    checksum = checker.check(file)
    row = sqlite_db.execute(
        "SELECT id, title, url, date FROM singlefile WHERE checksum = ?", (checksum,)
    ).fetchone()
    if row is not None:
        id, title, url, date = row
        sqlite_db.execute(
            "UPDATE singlefile SET lasttime = ? WHERE id = ?", (time.time(), id)
        )
        date = datetime.strptime(date, "%Y-%m-%d %H:%M:%S %z")
        return title, url, date
    info = parse_file(Path(tagfile.source_translate(file.path + "/" + file.name)))
    if info:
        sqlite_db.execute(
            "INSERT OR REPLACE INTO singlefile (checksum, title, url, date, lasttime) VALUES (?, ?, ?, ?, ?)",
            (
                checksum,
                info[0],
                info[1],
                info[2].strftime("%Y-%m-%d %H:%M:%S %z"),
                time.time(),
            ),
        )
        sqlite_db.commit()
    return info


def check_rename(file: File, tags: list[str]) -> Optional[str]:
    if file.is_dir:
        return None
    info = parse_file_cached(file)
    if info:
        title, url, date = info
        newname = name_by(
            Path(tagfile.source_translate(file.path + "/" + file.name)),
            title,
            url,
            tags,
            date,
        )
        return newname
    return None
