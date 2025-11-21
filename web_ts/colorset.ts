class ColorSet {
  onSet = (color: string | null) => {};
  constructor(
    public eleFG: HTMLInputElement,
    public eleBG: HTMLInputElement,
    public eleSet: HTMLElement,
    public eleClear: HTMLElement,
  ) {
    this.set(DEFAULT_COLOR);
    this.eleSet.onclick = () => {
      this.onSet(this.get());
    };
    this.eleClear.onclick = () => {
      this.onSet(null);
    };
  }
  get(): string {
    return `${this.eleFG.value}|${this.eleBG.value}`;
  }
  set(value: string | null) {
    if (value == null) {
      return;
    }
    let [fg, bg] = value.split("|");
    this.eleFG.value = fg;
    this.eleBG.value = bg;
  }
}
