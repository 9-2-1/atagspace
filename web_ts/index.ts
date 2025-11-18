const elename = [
  "home",
  "up",
  "path",
  "go",
  "filter",
  "find",
  "filelist",
  "category_create",
  "category_delete",
  "category_rename",
  "category_color_fg",
  "category_color_bg",
  "category_color",
  "category_clear",
  "category",
  "tag_add",
  "tag_remove",
  "tag_color_fg",
  "tag_color_bg",
  "tag_color",
  "tag_clear",
  "tags",
  "tagsinput",
  "tag_apply",
  "preview",
] as const;

function compare(a: string, b: string) {
  return a > b ? 1 : a < b ? -1 : 0;
}

class App {
  ele: { [key in (typeof elename)[number]]: HTMLElement } = byids(elename);
  ele_path = this.ele.path as HTMLInputElement;
  ele_filter = this.ele.filter as HTMLInputElement;
  ele_tagsinput = this.ele.tagsinput as HTMLInputElement;
  file: APIlist = [];
  fileindex: Map<number, APIlist[number]> = new Map();
  fileCheckData = new CheckData<number>(false, true);
  fileCheckGroup = new CheckGroup<number>();
  fileCheckMode = 0;
  category: APIcategory = [];
  cateindex: Map<string, APIcategory[number]> = new Map();
  colorindex: Map<string, string> = new Map();
  categoryCheckData = new CheckData<string>(true, false);
  categoryCheckGroup = new CheckGroup<string>();
  categoryColorSet = new ColorSet(
    this.ele.category_color_fg as HTMLInputElement,
    this.ele.category_color_bg as HTMLInputElement,
    this.ele.category_color,
    this.ele.category_clear,
  );
  tagCheckData = new CheckData<string>(true, false);
  tagCheckGroup = new CheckGroup<string>();
  tagColorSet = new ColorSet(
    this.ele.tag_color_fg as HTMLInputElement,
    this.ele.tag_color_bg as HTMLInputElement,
    this.ele.tag_color,
    this.ele.tag_clear,
  );
  lastMode: "go" | "find" = "go";

  constructor() {
    this._setupNavigate();
    this._setupFileSelect();
    this._setupTagSelect();
    this._setupCategoryButtons();
    this._setupTagButtons();
    this.categoryCheckData.onchange = () => {
      this.tagsLoad();
    };
    this._loadStateFromURL();
    this._reload();
  }

  _setupNavigate() {
    this.ele.home.onclick = async () => {
      await this.openFolder("");
    };
    this.ele.up.onclick = async () => {
      this.ele_path.value = this.ele_path.value
        .split("/")
        .slice(0, -1)
        .join("/");
      await this.openFolder(this.ele_path.value);
      this.fileCheckClear();
      await this.fileLoadAPI();
    };
    this.ele.go.onclick = () => {
      this.lastMode = "go";
      this._reload();
    };
    this.ele.find.onclick = () => {
      this.lastMode = "find";
      this._reload(true);
    };
  }

  _setupFileSelect() {
    this.fileCheckData.onchange = () => {
      this._fileTagInit();
    };
    this.fileCheckData.oninvoke = async (elem: CheckElem<number>) => {
      const file = this.fileindex.get(elem.name);
      if (file === undefined) {
        return;
      }
      const fullPath = this._fullPath(file);
      if (file.is_dir) {
        await this.openFolder(fullPath);
      } else {
        api.open_content(fullPath);
      }
    };
    this.fileCheckGroup.onfocus = (elem: CheckElem<number>) => {
      const file = this.fileindex.get(elem.name);
      if (file === undefined) {
        return;
      }
      const ele_preview = this.ele.preview as HTMLIFrameElement;
      ele_preview.src = "about:blank";
      if (file.is_dir) {
        return;
      }
      const fullPath = this._fullPath(file);
      setTimeout(() => {
        ele_preview.src = "/get_content?path=" + encodeURIComponent(fullPath);
      }, 30);
    };
  }

  _fileTagInit() {
    let checked = this.fileCheckData.select;
    this.tagCheckData.indeterminate.clear();
    this.tagCheckData.default_.clear();
    this.ele_tagsinput.value = "";
    if (checked.size === 0) {
      // No file selected.
      this.fileCheckMode = 0;
      this.ele_tagsinput.placeholder = "";
      this.ele.tag_apply.innerText = "添加";
    } else if (checked.size === 1) {
      // Single files selected.
      this.fileCheckMode = 1;
      const file = this.fileindex.get(checked.keys().next().value!);
      if (file === undefined) {
        return;
      }
      file.tags.forEach((tag) => {
        this.tagCheckData.default_.set(tag, 1);
      });
      this.ele_tagsinput.value = file.tags.join(" ");
      this.ele_tagsinput.placeholder = "tag1 tag2 tag3 ...";
      this.ele.tag_apply.innerText = "修改";
    } else {
      // Multiple files selected.
      this._fileTagInitMulti(checked);
    }
    this.tagCheckData.reset();
  }
  _fileTagInitMulti(checked: Map<number, number>) {
    this.fileCheckMode = 2;
    let tagsAnd = new Set<string>();
    let tagsOr = new Set<string>();
    let first = true;
    checked.forEach((value, key) => {
      const file = this.fileindex.get(key);
      if (file === undefined) {
        return;
      }
      file.tags.forEach((tag) => {
        tagsOr.add(tag);
      });
      if (first) {
        file.tags.forEach((tag) => {
          tagsAnd.add(tag);
        });
        first = false;
      } else {
        tagsAnd.forEach((tag) => {
          if (!file.tags.includes(tag)) {
            tagsAnd.delete(tag);
          }
        });
      }
    });
    tagsOr.forEach((tag) => {
      this.tagCheckData.indeterminate.add(tag);
      this.tagCheckData.default_.set(tag, 2);
    });
    tagsAnd.forEach((tag) => {
      this.tagCheckData.indeterminate.delete(tag);
      this.tagCheckData.default_.set(tag, 1);
    });
    this.ele_tagsinput.placeholder = "+tag1 +tag2 -tag3 -tag4 ...";
    this.ele.tag_apply.innerText = "修改";
  }
  _setupTagSelect() {
    this.tagCheckData.oninvoke = async (elem: CheckElem<string>) => {
      let cateelem = this.categoryCheckGroup.focusedElem();
      if (cateelem === null) {
        return;
      }
      let cate = this.cateindex.get(cateelem.name);
      if (cate === undefined) {
        return;
      }
      await api.set_tags({ tags: [elem.name], cate: cateelem.name });
      await this.categoryLoadAPI();
      this.tagsLoad();
    };
    this.tagCheckData.onchange = () => {
      if (this.fileCheckMode === 0) {
        // Do nothing
      } else if (this.fileCheckMode === 1) {
        let tags: Array<string> = [];
        this.tagCheckData.select.forEach((value, key) => {
          if (value === 1) {
            tags.push(key);
          }
        });
        this.ele_tagsinput.value = tags.join(" ");
      } else if (this.fileCheckMode === 2) {
        let tagchanges: Array<string> = [];
        this.tagCheckData.select.forEach((value, key) => {
          if (value === 2) {
            return;
          }
          let default_ = this.tagCheckData.default_.get(key) ?? 0;
          if (value !== default_) {
            tagchanges.push((value === 1 ? "+" : "-") + key);
          }
        });
        this.tagCheckData.default_.forEach((value, key) => {
          if (!this.tagCheckData.select.has(key)) {
            tagchanges.push("-" + key);
          }
        });
        this.ele_tagsinput.value = tagchanges.join(" ");
      }
    };
    this.ele.tag_apply.onclick = async () => {
      if (this.fileCheckMode === 0) {
        let cate = this.categoryCheckGroup.focusedElem();
        if (cate !== null) {
          let tags = this.ele_tagsinput.value
            .split(" ")
            .filter((tag: string) => tag !== "");
          if (tags.length > 0) {
            await api.set_tags({ tags: tags, cate: cate.name });
            await this.categoryLoadAPI();
            this.tagsLoad();
          }
        }
      } else if (this.fileCheckMode === 1) {
        const file = this.fileindex.get(
          this.fileCheckData.select.keys().next().value!,
        );
        if (file === undefined) {
          return;
        }
        file.tags = this.ele_tagsinput.value
          .split(" ")
          .filter((tag: string) => tag !== "");
        await api.tag_file({ ids: [file.id], tags: file.tags });
        await this.fileLoadAPI();
        this._fileTagInit();
      } else if (this.fileCheckMode === 2) {
        let tagchanges = this.ele_tagsinput.value;
        let ids = [...this.fileCheckData.select.keys()];
        let adds: Array<string> = [];
        let removes: Array<string> = [];
        let clearall = false;
        tagchanges.split(" ").forEach((tagchange) => {
          if (tagchange === "") {
            return;
          }
          if (tagchange[0] === "+") {
            adds.push(tagchange.slice(1));
          } else if (tagchange === "-") {
            clearall = true;
          } else if (tagchange[0] === "-") {
            removes.push(tagchange.slice(1));
          } else {
            adds.push(tagchange);
          }
        });
        if (clearall) {
          await api.tag_file({ ids, tags: adds });
        } else {
          await api.tag_file_change({ ids, adds, removes });
        }
        await this.fileLoadAPI();
        this._fileTagInit();
      }
    };
  }

  _setupCategoryButtons() {
    this.ele.category_create.onclick = async () => {
      let name = prompt("Category name");
      if (name === null) {
        return;
      }
      await api.set_category({ name, color: null });
      await this.categoryLoadAPI();
    };
    this.ele.category_delete.onclick = async () => {
      let old_cate = this.categoryCheckGroup.focusedElem();
      if (old_cate === null) {
        return;
      }
      let name = old_cate.name;
      if (!confirm("Are you sure to delete category " + name + "?")) {
        return;
      }
      await api.remove_category({ name });
      await this.categoryLoadAPI();
    };
    this.ele.category_rename.onclick = async () => {
      let old_cate = this.categoryCheckGroup.focusedElem();
      if (old_cate === null) {
        return;
      }
      let name = old_cate.name;
      let newname = prompt("New category name", name);
      if (newname === null) {
        return;
      }
      await api.rename_category({ name, newname });
      await this.categoryLoadAPI();
    };
    this.categoryCheckGroup.onfocus = (elem) => {
      if (this.categoryCheckData.select.has(elem.name)) {
        // TODO move to top
        this.categoryCheckData.select.delete(elem.name);
        this.categoryCheckData.select.set(elem.name, 1);
      }
      this.categoryColorSet.set(
        this.cateindex.get(elem.name)?.color ?? "#c0c0c0|#ffffff",
      );
    };
    this.categoryColorSet.onSet = async (color) => {
      let name = this.categoryCheckGroup.focusedElem()?.name;
      if (name === undefined) {
        return;
      }
      await api.set_category({ name, color });
      await this.categoryLoadAPI();
    };
  }

  _setupTagButtons() {
    this.ele.tag_add.onclick = async () => {
      let tags = [...this.tagCheckData.select.keys()];
      if (tags.length === 0) {
        return;
      }
      let cate = this.categoryCheckGroup.focusedElem()?.name;
      if (cate === undefined) {
        return;
      }
      await api.set_tags({ tags, cate });
      await this.categoryLoadAPI();
      this.tagsLoad();
    };
    this.ele.tag_remove.onclick = async () => {
      let tags = [...this.tagCheckData.select.keys()];
      if (tags.length === 0) {
        return;
      }
      await api.remove_tags({ tags });
      await this.categoryLoadAPI();
      this.tagsLoad();
    };
    this.tagCheckGroup.onfocus = (elem) => {
      this.tagColorSet.set(this.colorindex.get(elem.name) ?? "#c0c0c0|#ffffff");
    };
    this.tagColorSet.onSet = async (color) => {
      let tags = [...this.tagCheckData.select.keys()];
      if (tags.length === 0) {
        return;
      }
      await api.set_tags_color({ tags, color });
      await this.categoryLoadAPI();
      this.tagColorReload();
    };
  }

  async openFolder(path: string) {
    this.ele_path.value = path;
    this.fileCheckClear();
    await this.fileLoadAPI();
    this._updateURLState();
  }

  async _reload(recurse: boolean = false) {
    await this.categoryLoadAPI();
    this.categoryCheckData.reset();
    this.tagsLoad();
    this.fileCheckClear();
    await this.fileLoadAPI(recurse);
    this._updateURLState();
  }

  _fullPath(file: APIlist[number]) {
    let ret = file.name;
    if (file.path !== "") {
      ret = file.path + "/" + ret;
    }
    return ret;
  }
  async fileLoadAPI(recurse: boolean = false) {
    let path = this.ele_path.value;
    let filter = this.ele_filter.value;
    let list = await api.list({ path, filter, recurse });
    this.fileLoad(list);
  }
  fileCheckClear() {
    this.fileCheckData.clear();
  }
  fileLoad(list: APIlist) {
    this.file = list;
    this.ele.filelist.innerHTML = "";
    this.fileindex.clear();
    this.fileCheckGroup.clear();
    list.forEach((file) => {
      const tags: Array<HTMLElement> = [];
      const fileTagGroup = new CheckGroup<string>();
      file.tags.forEach((tag) => {
        const tagCheck = new CheckElem(
          tag,
          Ele("div", ["tag", "check"], [tag]),
        );
        this.tagCheckData.add(tagCheck);
        this.applyColor(tagCheck.elem, this.getColor(tag));
        fileTagGroup.add(tagCheck);
        tags.push(tagCheck.elem);
      });
      const fileCheck = new CheckElem(
        file.id,
        Ele(
          "div",
          ["file", "h-0", "check"],
          [
            Ele("div", [], [file.name + (file.is_dir ? "/" : "")]),
            Ele("div", [], tags),
          ],
        ),
      );
      this.fileCheckData.add(fileCheck);
      this.fileCheckGroup.add(fileCheck);
      this.fileindex.set(file.id, file);
      this.ele.filelist.appendChild(fileCheck.elem);
    });
  }

  async categoryLoadAPI() {
    let category = await api.category();
    // this.categoryCheckClear();
    this.categoryLoad(category);
  }
  categoryCheckClear() {
    this.categoryCheckData.clear();
  }
  categoryLoad(category: APIcategory) {
    this.ele.category.innerHTML = ""; // TODO safer clean
    this.category = category;
    this.cateindex.clear();
    this.colorindex.clear();
    // preserve focus
    let focused = this.categoryCheckGroup.focusedElem()?.name;
    this.categoryCheckGroup.clear();
    category
      .sort((a, b) => compare(a.name, b.name))
      .forEach((cate) => {
        const name = cate.name;
        const categoryCheck = new CheckElem(
          name,
          Ele("div", ["category", "check"], [name == "" ? "未分类" : name]),
        );
        this.categoryCheckData.add(categoryCheck);
        this.categoryCheckGroup.add(categoryCheck);
        const catecolor = cate.color ?? category[0]?.color ?? "#c0c0c0|#ffffff";
        this.applyColor(categoryCheck.elem, catecolor);
        this.ele.category.appendChild(categoryCheck.elem);
        cate.tags.forEach((tag) => {
          this.colorindex.set(tag.name, tag.color ?? catecolor);
        });
        this.cateindex.set(cate.name, cate);
        this.categoryCheckData.default_.set(cate.name, 1);
        if (cate.name === focused) {
          this.categoryCheckGroup.focus(categoryCheck);
        }
      });
    this.tagsLoad();
    this.tagColorReload();
  }

  tagsLoad() {
    this.ele.tags.innerHTML = ""; // TODO safer clean
    this.tagCheckGroup.clear();
    [...this.categoryCheckData.select.keys()].reverse().forEach((catename) => {
      const cate = this.cateindex.get(catename);
      if (cate === undefined) {
        return;
      }
      cate.tags
        .sort((a, b) => compare(a.name, b.name))
        .forEach((tag) => {
          const tagCheck = new CheckElem(
            tag.name,
            Ele("div", ["tag", "check"], [tag.name]),
          );
          this.ele.tags.appendChild(tagCheck.elem);
          const color = this.getColor(tag.name);
          this.applyColor(tagCheck.elem, color);
          this.tagCheckData.add(tagCheck);
          this.tagCheckGroup.add(tagCheck);
        });
    });
  }

  tagColorReload() {
    this.tagCheckData.index.elemMap.forEach((tags, name) => {
      const color = this.getColor(name);
      tags.forEach((tag) => {
        this.applyColor(tag.elem, color);
      });
    });
  }

  applyColor(ele: HTMLElement, color: string) {
    let [fgcolor, bgcolor] = color.split("|");
    ele.style.setProperty("--fgcolor", fgcolor);
    ele.style.setProperty("--bgcolor", bgcolor);
  }

  getColor(name: string) {
    return this.colorindex.get(name) ?? "#c0c0c0|#ffffff";
  }

  _updateURLState() {
    const params = new URLSearchParams();
    const path = this.ele_path.value;
    const filter = this.ele_filter.value;
    const mode = this.lastMode;

    if (path) {
      params.set("path", path);
    }
    if (filter) {
      params.set("filter", filter);
    }
    if (mode) {
      params.set("mode", mode);
    }

    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newURL);
  }

  _loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const path = params.get("path");
    const filter = params.get("filter");
    const mode = params.get("mode");

    if (path !== null) {
      this.ele_path.value = path;
    }
    if (filter !== null) {
      this.ele_filter.value = filter;
    }
    this._reload(mode == "find");
  }
}

window.addEventListener("load", () => {
  new App();
});
