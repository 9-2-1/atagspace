class CheckElem<NAME> {
  data: CheckData<NAME> | null = null;
  group: CheckGroup<NAME> | null = null;
  groupindex: number | null = null;
  constructor(
    public name: NAME,
    public elem: HTMLElement,
  ) {
    elem.onclick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.data !== null) {
        if (!this.data.sticky && !e.shiftKey && !e.ctrlKey) {
          this.data.reset(true);
        }
        this.data.change(this.name);
      }
      if (this.group !== null && this.groupindex !== null) {
        if (e.shiftKey && this.group.focused != this.groupindex) {
          this._extendcheck();
        }
        this.group.focus(this);
      }
    };
    elem.ondblclick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.group !== null) {
        this.group.focus(this);
      }
      if (this.data !== null) {
        this.data.invoke(this);
      }
    };
    elem.oncontextmenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.data !== null) {
        if (this.data.rightreset) {
          this.data.reset(true);
        }
      }
      if (this.group !== null) {
        this.group.focus(this);
      }
    };
  }
  _extendcheck() {
    if (
      this.data !== null &&
      this.group !== null &&
      this.groupindex !== null &&
      this.group.focused !== null
    ) {
      const statu = this.data.get(this.group.focusedElem()!.name);
      if (this.groupindex > this.group.focused) {
        for (let i = this.group.focused; i <= this.groupindex; i++) {
          this.data.update(this.group.getElem(i).name, statu);
        }
      } else {
        for (let i = this.group.focused; i >= this.groupindex; i--) {
          this.data.update(this.group.getElem(i).name, statu);
        }
      }
    }
  }
  setSelect(select: number) {
    this.elem.classList.remove("checked");
    this.elem.classList.remove("indeterminate");
    if (select == 2) {
      this.elem.classList.add("indeterminate");
    } else if (select == 1) {
      this.elem.classList.add("checked");
    }
  }
  setFocus(focused: boolean) {
    if (focused) {
      this.elem.classList.add("focused");
    } else {
      this.elem.classList.remove("focused");
    }
  }
}

class CheckElemIndex<NAME> {
  elemMap: Map<NAME, Set<CheckElem<NAME>>> = new Map();
  add(elem: CheckElem<NAME>) {
    if (!this.elemMap.has(elem.name)) {
      this.elemMap.set(elem.name, new Set());
    }
    this.elemMap.get(elem.name)!.add(elem);
  }
  delete(elem: CheckElem<NAME>) {
    const set = this.elemMap.get(elem.name) ?? new Set();
    if (set.size == 1) {
      this.elemMap.delete(elem.name);
    } else {
      set.delete(elem);
    }
  }
  get(name: NAME) {
    return this.elemMap.get(name) ?? new Set();
  }
  clear() {
    this.elemMap.clear();
  }
}

class CheckData<NAME> {
  index: CheckElemIndex<NAME> = new CheckElemIndex<NAME>();
  indeterminate: Set<NAME> = new Set();
  select: Map<NAME, number> = new Map();
  default_: Map<NAME, number> = new Map();
  constructor(
    public sticky: boolean = false,
    public rightreset: boolean = false,
  ) {}
  onchange = () => {};
  oninvoke = (checkelem: CheckElem<NAME>) => {};
  add(checkelem: CheckElem<NAME>) {
    this.index.add(checkelem);
    checkelem.data = this;
    checkelem.setSelect(this.get(checkelem.name));
  }
  change(name: NAME) {
    const max = this.indeterminate.has(name) ? 2 : 1;
    let sel = this.get(name);
    if (sel == max) {
      sel = 0;
    } else {
      sel++;
    }
    this.update(name, sel);
  }
  update(name: NAME, sel: number, user: boolean = true) {
    if (sel !== 0) {
      if (sel === 2 && !this.indeterminate.has(name)) {
        // not supporting indeterminate, reset to default
        sel = this.default_.get(name) ?? 0;
      }
      this.select.set(name, sel);
    } else {
      this.select.delete(name);
    }
    this.index.get(name).forEach((x: CheckElem<NAME>) => {
      x.setSelect(sel);
    });
    if (user) {
      this.onchange();
    }
  }
  invoke(checkelem: CheckElem<NAME>) {
    this.oninvoke(checkelem);
  }
  delete(checkelem: CheckElem<NAME>) {
    this.index.delete(checkelem);
    checkelem.data = null;
  }
  get(name: NAME) {
    return this.select.get(name) ?? 0;
  }
  reset(user: boolean = false) {
    let toreset: Set<NAME> = new Set();
    this.select.forEach((v: number, k: NAME) => {
      if (v !== this.default_.get(k)) {
        toreset.add(k);
      }
    });
    this.default_.forEach((v: number, k: NAME) => {
      if (v !== this.select.get(k)) {
        toreset.add(k);
      }
    });
    toreset.forEach((k) => {
      const v = this.default_.get(k) ?? 0;
      this.update(k, v, user);
    });
  }
  clear() {
    this.select.clear();
    this.indeterminate.clear();
    this.index.elemMap.forEach((y: Set<CheckElem<NAME>>) => {
      y.forEach((x: CheckElem<NAME>) => {
        x.data = null;
      });
    });
    this.index.clear();
  }
}

class CheckGroup<NAME> {
  focused: number | null;
  onfocus = (elem: CheckElem<NAME>) => {};
  elist: Array<CheckElem<NAME>>;
  constructor() {
    this.focused = null;
    this.elist = [];
  }
  add(elem: CheckElem<NAME>) {
    elem.groupindex = this.elist.length;
    this.elist.push(elem);
    elem.group = this;
    if (this.focused === elem.groupindex) {
      elem.setFocus(true);
    }
  }
  focus(elem: CheckElem<NAME>) {
    if (this.focused === elem.groupindex) {
      return;
    }
    if (this.focused !== null) {
      this.elist[this.focused].setFocus(false);
    }
    this.focused = elem.groupindex;
    elem.setFocus(true);
    this.onfocus(elem);
  }
  clear() {
    if (this.focused !== null) {
      this.elist[this.focused].setFocus(false);
    }
    this.focused = null;
    this.elist.forEach((x) => {
      x.group = null;
    });
    this.elist = [];
  }
  focusedElem() {
    if (this.focused === null) {
      return null;
    }
    return this.elist[this.focused];
  }
  getElem(index: number) {
    return this.elist[index];
  }
  forEach(fn: (x: CheckElem<NAME>) => any) {
    this.elist.forEach(fn);
  }
}
