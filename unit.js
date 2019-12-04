splitArray = (arr, filter) =>
  arr.reduce((a, b, i) => {
    i % filter ? a[a.length - 1].push(b) : a.push([b]);
    return a;
  }, []);
