import * as Images from "./image";

const BG_TYPE = {
  IMAGE: "image",
  COLOR: "color"
};
export default ({
  canvas, // canvas ele
  scrollEle = {
    // scroll ele 页面最外层滚动对象
    scrollTop: 0,
    offsetTop: 0
  },
  backgroundColor,
  backgroundImage,
  //brushSize => xyCorrect
  //50=>20 (40||30)=>15 20=>10 10=>5
  brushSize = 40,
  xyCorrect = 15,
  onLoad = () => {},
  progress = percent => percent // 已经清楚区域的百分比 number
}) => {
  if (!canvas) {
    return;
  }
  try {
    const bgType = backgroundImage ? BG_TYPE.IMAGE : BG_TYPE.COLOR;
    backgroundColor = backgroundColor || "#eee";

    let isDrawing, lastPoint;
    // var container = document.getElementById('js-container'),
    // var canvas = document.getElementById('js-canvas'),
    var canvasWidth = canvas.width,
      canvasHeight = canvas.height,
      ctx = canvas.getContext("2d"),
      image,
      brush = new Image();

    if (bgType === BG_TYPE.IMAGE) {
      // base64 Workaround because Same-Origin-Policy
      image = new Image();
      image.src = backgroundImage;
      image.onload = function() {
        ctx.drawImage(image, 0, 0);
        onLoad();
        // Show the form when Image is loaded.
        // document.querySelectorAll('.form')[0].style.visibility = 'visible';
      };
    } else if (bgType === BG_TYPE.COLOR) {
      ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      onLoad();
    } else {
      throw new Error("bgType value does not exist");
    }

    brush.src = Images.brush;

    canvas.addEventListener("mousedown", handleMouseDown, false);
    canvas.addEventListener("touchstart", handleMouseDown, false);
    canvas.addEventListener("mousemove", handleMouseMove, false);
    canvas.addEventListener("touchmove", handleMouseMove, false);
    canvas.addEventListener("mouseup", handleMouseUp, false);
    canvas.addEventListener("touchend", handleMouseUp, false);

    function distanceBetween(point1, point2) {
      return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
      );
    }

    function angleBetween(point1, point2) {
      return Math.atan2(point2.x - point1.x, point2.y - point1.y);
    }

    // Only test every `stride` pixel. `stride`x faster,
    // but might lead to inaccuracy
    function getFilledInPixels(stride) {
      if (!stride || stride < 1) {
        stride = 1;
      }

      var pixels = ctx.getImageData(0, 0, canvasWidth, canvasHeight),
        pdata = pixels.data,
        l = pdata.length,
        total = l / stride,
        count = 0;

      // Iterate over all pixels
      for (var i = (count = 0); i < l; i += stride) {
        if (parseInt(pdata[i]) === 0) {
          count++;
        }
      }

      return Math.round((count / total) * 100);
    }

    function getMouse(e, canvas) {
      // document.getElementById('main-view')
      var mainView = scrollEle;
      var scrollTop = mainView.scrollTop;
      // var scrollTop = document.getElementById('main-view').offsetTop;

      var offsetX = 0,
        offsetY = 0,
        mx,
        my;

      if (canvas.offsetParent !== undefined) {
        do {
          offsetX += canvas.offsetLeft;
          offsetY += canvas.offsetTop;
        } while ((canvas = canvas.offsetParent));
      }

      mx = (e.pageX || e.touches[0].clientX) - offsetX;
      my = (e.pageY || e.touches[0].clientY) - offsetY;

      return { x: mx, y: my + scrollTop };
    }

    function handlePercentage(filledInPixels) {
      filledInPixels = filledInPixels || 0;
      // console.log(filledInPixels + '%');
      progress(filledInPixels);
      // if (filledInPixels > 50) {
      //   // canvas.parentNode.removeChild(canvas);
      // }
    }

    function handleMouseDown(e) {
      isDrawing = true;
      lastPoint = getMouse(e, canvas);
    }

    function handleMouseMove(e) {
      if (!isDrawing) {
        return;
      }

      e.preventDefault();

      var currentPoint = getMouse(e, canvas),
        dist = distanceBetween(lastPoint, currentPoint),
        angle = angleBetween(lastPoint, currentPoint),
        x,
        y;

      for (var i = 0; i < dist; i++) {
        x = lastPoint.x + Math.sin(angle) * i - xyCorrect; //25
        y = lastPoint.y + Math.cos(angle) * i - xyCorrect;
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(brush, x, y, brushSize, brushSize);
      }

      lastPoint = currentPoint;
      handlePercentage(getFilledInPixels(32));
    }

    function handleMouseUp(e) {
      isDrawing = false;
    }
  } catch (error) {
    throw error;
  }
};
