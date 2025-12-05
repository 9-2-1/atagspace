const nameGroup = 6;

function _addNameBy1(name) {
  for (let i = nameGroup - 1; i >= 0; i--) {
    if (name[i] === 'z') continue;
    return (
      name.slice(0, i) + String.fromCharCode(name.charCodeAt(i) + 1) + 'a'.repeat(nameGroup - i - 1)
    );
  }
  return name + 'a'.repeat(nameGroup);
}

console.log(_addNameBy1(''));
console.log(_addNameBy1('aaaaaa'));
console.log(_addNameBy1('abcxyz'));
console.log(_addNameBy1('zzzzzy'));
console.log(_addNameBy1('zzzzzz'));
console.log(_addNameBy1('zzzzzzzzzzzz'));
