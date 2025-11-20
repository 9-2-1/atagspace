"""
Common utilities for CLI commands.
"""

import logging
from .. import category


# Set up logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Color formatting utilities
tagfmt_errors: set[str] = set()


def colorparse(c: str) -> tuple[int, int, int]:
    """Parse color string to RGB tuple."""
    r, g, b = 0, 0, 0
    if (len(c) == 7 or len(c) == 9) and c[0] == "#":
        r = int(c[1:3], 16)
        g = int(c[3:5], 16)
        b = int(c[5:7], 16)
    return r, g, b


def tagfmt(tag: str, color: bool = False) -> str:
    """Format tag with optional color."""
    ret = tag
    if color:
        c = category.get_color(tag)
        if c is not None:
            try:
                f, b = c.split("|")
                fr, fg, fb = colorparse(f)
                br, bg, bb = colorparse(b)
                ret = f"\x1b[38;2;{fr};{fg};{fb}m\x1b[48;2;{br};{bg};{bb}m{ret}\x1b[39;49m"
            except Exception:
                if c not in tagfmt_errors:
                    log.warning(f"Cannot parse color {c}\n")
                    tagfmt_errors.add(c)
    return ret
