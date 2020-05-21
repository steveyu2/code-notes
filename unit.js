splitArray = (arr, filter) =>
  arr.reduce((a, b, i) => {
    i % filter ? a[a.length - 1].push(b) : a.push([b]);
    return a;
  }, []);
NumberGroupsCalculation = (groups) => {
  const results = [];
  const keys = Object.keys(groups);
  if (keys.length > 0 && keys.some((v) => groups[v].length > 0)) {
    const loop = (item, count) => {
      const key = keys[count];
      const items = groups[key];
      const _count = count + 1;
      if (items.length > 0) {
        items.forEach((v) => {
          const _item = {...item, [key]: v};
          keys.length === _count ? results.push(_item) : loop(_item, _count);
        });
      } else {
        keys.length === _count ? results.push(item) : loop(item, _count);
      }
    };
    loop({}, 0);
  }
  return results;
};
strIsNumber = (v) => /^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)|(\d))$/.test(v + '');
