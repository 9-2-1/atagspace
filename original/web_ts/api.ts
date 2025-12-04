async function _api(path: string, param: any) {
  return await (await fetch(path, { method: 'POST', body: JSON.stringify(param) })).json();
}

// TODO API Object
type APIlist = Array<{
  id: number;
  path: string;
  name: string;
  size: number;
  mtime: number;
  dev: number | null;
  ino: number | null;
  checksum: string | null;
  is_dir: boolean;
  tags: Array<string>;
  deltime: null;
}>;

type APIcategory = Array<{
  name: string;
  color: string | null;
  tags: Array<{ name: string; color: string | null }>;
}>;

let api = {
  list: async (param: { path: string; filter?: string; recurse?: boolean; limit?: number }) => {
    let ret = await _api('/list', param);
    return ret.map((item: any) => ({
      ...item,
      tags: item.tags.split(' ').filter((tag: string) => tag !== ''),
    })) as APIlist;
  },
  category: () => _api('/category', {}) as Promise<APIcategory>,
  set_category: (param: { name: string; color: string | null }) =>
    _api('/set_category', param) as Promise<null>,
  rename_category: (param: { name: string; newname: string }) =>
    _api('/rename_category', param) as Promise<null>,
  remove_category: (param: { name: string }) => _api('/remove_category', param) as Promise<null>,
  set_tags: (param: { tags: Array<string>; cate: string }) =>
    _api('/set_tags', param) as Promise<null>,
  remove_tags: (param: { tags: Array<string> }) => _api('/remove_tags', param) as Promise<null>,
  set_tags_color: (param: { tags: Array<string>; color: string | null }) =>
    _api('/set_tags_color', param) as Promise<null>,
  tag_file: (param: { ids: Array<number>; tags: Array<string> }) =>
    _api('/tag_file', param) as Promise<null>,
  tag_file_change: (param: { ids: Array<number>; adds: Array<string>; removes: Array<string> }) =>
    _api('/tag_file_change', param) as Promise<null>,
  open_content: (path: string) => _api('/open_content', { path }) as Promise<null>,
};
