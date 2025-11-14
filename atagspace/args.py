# TODO
from typing import Callable


def root(fn: Callable[..., None]) -> Callable[[str], None]:
    """
    >>> @root
    ... def main(a,b,/,c,d,e,f,*,g,h,i):
    ...     return a,b,c,d,e,f,g,h,i
    >>> ",".join(main('1 2 3 4 5 6 -g 7 -h 8 -i 9'))
    1,2,3,4,5,6,7,8,9
    >>> ",".join(main('1 2 -c 3 -d 4 -e 5 -f 6 -g 7 -h 8 -i 9'))
    1,2,3,4,5,6,7,8,9
    >>> ",".join(main('-a 1 -b 2 -c 3 -d 4 -e 5 -f 6 -g 7 -h 8 -i 9'))
    Traceback ...
    >>> ",".join(main('1 2 3 4 5 6 7 8 9'))
    Traceback ...
    """
    ...
