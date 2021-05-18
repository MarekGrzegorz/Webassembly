let instance = null;
let memoryStates = new WeakMap();

let sum = 0;

async function initMd() {

  let instance = null;
  let memoryStates = new WeakMap();

  function syscall(instance, n, args) {
    switch (n) {
      default:
        // console.log("Syscall " + n + " NYI.");
        break;
      case /* brk */ 45: return 0;
      case /* writev */ 146:
        return instance.exports.writev_c(args[0], args[1], args[2]);
      case /* mmap2 */ 192:
        //debugger;
        const memory = instance.exports.memory;
        let memoryState = memoryStates.get(instance);
        const requested = args[1];
        if (!memoryState) {
          memoryState = {
            object: memory,
            currentPosition: memory.buffer.byteLength,
          };
          memoryStates.set(instance, memoryState);
        }
        let cur = memoryState.currentPosition;
        if (cur + requested > memory.buffer.byteLength) {
          const need = Math.ceil((cur + requested - memory.buffer.byteLength) / 65536);
          memory.grow(need);
        }
        memoryState.currentPosition += requested;
        return cur;
    }
  }

  const response = await fetch("../out/main.wasm");
  const buffer = await response.arrayBuffer();
  const obj = await WebAssembly.instantiate(buffer,  { 
    env: {
      __syscall0: function __syscall0(n) { return syscall(instance, n, []); },
      __syscall1: function __syscall1(n, a) { return syscall(instance, n, [a]); },
      __syscall2: function __syscall2(n, a, b) { return syscall(instance, n, [a, b]); },
      __syscall3: function __syscall3(n, a, b, c) { return syscall(instance, n, [a, b, c]); },
      __syscall4: function __syscall4(n, a, b, c, d) { return syscall(instance, n, [a, b, c, d]); },
      __syscall5: function __syscall5(n, a, b, c, d, e) { return syscall(instance, n, [a, b, c, d, e]); },
      __syscall6: function __syscall6(n, a, b, c, d, e, f) { return syscall(instance, n, [a, b, c, d, e, f]); },
      rand_js: function () {return Math.floor(Math.random() * 256);}
    }
      } );
  instance = obj.instance;

  let runMandelbrotSet = true;
  const scala = [ -2.2, 1.2, -1.7, 1.7 ];
  const dx = 1000, dy = 1000;
  const iteraciones = 2000;

  let c = document.getElementById("myCanvas");
  let ctx = c.getContext("2d");

  instance.exports.init(dx,dy,iteraciones);
  
  function MandelbrotSet(){
  instance.exports.setScaleMandelbrotSet( ...scala )

  runMandelbrotSet = false;
  const jsArray = new Uint8ClampedArray (dx*dy*4);
  const cArrayPointer = instance.exports.malloc_(jsArray.length);

  const cArray = new Uint8ClampedArray(
    instance.exports.memory.buffer,
    cArrayPointer,
    jsArray.length
  );

  cArray.set(jsArray);
  instance.exports.mandelbrot(cArrayPointer, jsArray.length );

  const img = new ImageData( cArray, dx, dy );
  ctx.putImageData( img, 0, 0 );
  }

let isDrawing = false;
let x0 = 0, y0 = 0;
let x = 0, y = 0, scl = 1;
let newElem = document.createElement("div");
let elem = document.querySelector(`body`);
newElem.id = 'marcaX';
// Add the event listeners for mousedown, mousemove, and mouseup
c.addEventListener('mousedown', e => {
  x0 = e.offsetX;
  y0 = e.offsetY;
  //drawLine(ctx, x, y, e.offsetX, e.offsetY);
  isDrawing = true;

});

c.addEventListener('mousemove', e => {
  if (isDrawing === true) {
    drawLine(ctx);
    x = e.offsetX;
    y = e.offsetY;
  }
});

window.addEventListener('mouseup', e => {
  if (isDrawing === true) {

    let s = ((x - x0)/dx > (y - y0)/dy) ?  (x - x0)/dx : (y - y0)/dy
    const x_aux = (scala[1] - scala[0]) * s;
    const y_aux = (scala[3] - scala[2]) * s;

    scala[0] =  x0/dx*(scala[1] - scala[0]) + scala[0];
    scala[1] = scala[0] + x_aux;
    scala[2] = y0/dy*(scala[3] - scala[2]) + scala[2];
    scala[3] = scala[2] + y_aux;
    scl *= (1/s * 1/s).toFixed(2);
    console.log (`scala ${new Intl.NumberFormat().format(scl)}`)
    MandelbrotSet();

    x = 0;
    y = 0;
    isDrawing = false;   
  }
});

function drawLine(context) {
 
  newElem.setAttribute("style",
      `
      width: ${x - x0}px;  
      height: ${y - y0}px; 
      background-color: rgba(20, 80, 255, .2);;
      position: absolute; 
      top: ${y0}px; left: ${x0}px;
      border: 1px solid black;
      z-index: 2;
      `
 );
  elem.appendChild(newElem);
}
if (runMandelbrotSet){MandelbrotSet();}

}
initMd();
