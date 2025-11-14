function byid<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}

function byids<T extends ReadonlyArray<string>>(ids: T) {
  let ret: { [key in string]: HTMLElement } = {};
  ids.forEach((id) => {
    ret[id] = byid(id);
  });
  return ret as { [key in T[number]]: HTMLElement };
}

function Ele(
  tag: string,
  class_: Array<string>,
  child: Array<HTMLElement | string>,
) {
  const ele = document.createElement(tag);
  for (const cls of class_) {
    ele.classList.add(cls);
  }
  for (const chi of child) {
    if (typeof chi === "string") {
      const text = document.createTextNode(chi);
      ele.appendChild(text);
    } else {
      ele.appendChild(chi);
    }
  }
  return ele;
}
