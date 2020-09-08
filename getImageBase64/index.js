const getImageBase64 = (uri, width = 240, height = 240) => {
  return new Promise((res) => {
    let img = new Image();
    let canvas = document.createElement('canvas');
    img.crossOrigin = 'anonymous';
    img.src = uri;
    img.width = width;
    img.height = height;
    // img.cssText = 'display:none;';
    img.onload = () => {
      let ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      res(canvas.toDataURL('image/png'));
    };
    document.body.appendChild(img);
  });
};
