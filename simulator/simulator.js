function blit(ctx, X, Y, buf, index, tint) {
  if (index != index) {
    return;
  }
  index = Math.floor(index);
  pt = 0;
  let len = 0;
  while (true) {
    len = (buf[pt++] << 8) + buf[pt++];
    if (index <= 0) {
      break;
    }
    pt += len;
    index--;
  }

  const type = buf[pt++];
  const w = buf[pt++];
  if (type !== 1) {
    console.error('Buf type != 1', type);
    return;
  }

  let x = 0;
  let y = 0;
  let br = 0;
  let rle = 0;
  len = pt + len - 1;
  while (pt < len) {
    if (rle == 0) {
      br = buf[pt++];
      if (br & 0b10000000) {
        br &= 0b111111;
        rle = buf[pt++] - 1;
      }
    } else {
      rle--;
    }
    const bb = (br << 2) + ((br >> 4) & 0b11);
    const nbb = 0xff - bb;
    const [or, og, ob] = ctx.getImageData(X + x, Y + y, 1, 1).data;
    const r = ((or * nbb) + (bb * tint[0])) >> 8;
    const g = ((og * nbb) + (bb * tint[1])) >> 8;
    const b = ((ob * nbb) + (bb * tint[2])) >> 8;
    ctx.fillStyle = `RGB(${r},${g},${b})`
    ctx.fillRect(X + x, Y + y, 1, 1);

    x++;
    if (x === w) {
      x = 0;
      y++;
    }
  }

  return w;
}

let fbPrimitives = [];
let ctx;
let fbChanged = false;
let fbId = 0;
const fb = {
  init() {
    ctx = document.getElementById('offscreen').getContext('2d');
  },
  add(cfg) {
    fbChanged = true;
    const o = { ...cfg, id: fbId++ };
    fbPrimitives.push(o);
    if (typeof o.c === 'number') {
      if (o.c === 0) {
        o.c = [0, 0, 0];
      }
      if (o.c === 0xffff) {
        o.c = [0xff, 0xff, 0xff];
      }
    }
    return fbId - 1;
  },
  set(id, cfg) {
    const index = fbPrimitives.findIndex(o => o.id === id);
    if (index < 0) {
      console.error('cannot find index', id);
    }
    fbChanged = true;
    const o = { ...fbPrimitives[index], ...cfg };
    fbPrimitives[index] = o;
    if (typeof o.c === 'number') {
      if (o.c === 0) {
        o.c = [0, 0, 0];
      }
      if (o.c === 0xffff) {
        o.c = [0xff, 0xff, 0xff];
      }
    }
  },
  remove(i) {
    fbChanged = true;
    fbPrimitives = fbPrimitives.filter(({ id }) => id != i);
  },
  render() {
    if (!fbChanged) {
      return;
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 240, 240);
    fbPrimitives.forEach(p => {
      if (p.buf) {
        if (typeof p.index === 'number') {
          blit(ctx, p.x, p.y, p.buf, p.index, p.c);
        } else {
          let x = p.x;
          for (ind of p.index) {
            x += blit(ctx, x, p.y, p.buf, ind, p.c) + 2;
          }
        }
      } else {
        if (p.w > 0 && p.h > 0) {
          ctx.fillStyle = `RGB(${p.c[0]},${p.c[1]},${p.c[2]})`;
          ctx.fillRect(p.x, p.y, p.w, p.h);
        }
      }
    });
    fbChanged = false;
  },
  color: (r, g, b) => [r, g, b],
}

const spim = {
  setup(cfg) { console.log('initializing spim with config', cfg) },
  send(buf, dc) { console.log('spim send async', buf, dc) },
  sendSync(buf, dc) { console.log('spim send', buf, dc) },
}

const storageData = {};
const Storage = {
  readArrayBuffer: (file) => storageData[file],
  erase(file) { storageData[file] = [] },
  write(file, data, offset, total) {
    if (!storageData[file]) {
      storageData = Array.from(Array(total))
    }
    const f = storageData[file];
    data.forEach((d, i) => f[i + offset] = d);
  },
  getFree() { return 12345; }
}

const modules = {
  spim,
  fb,
  Storage,
};

window.E = {
  reboot() { document.history.go(0) },
  enableWatchdog() { console.log('Watchdog enabled') },
}

window.i2cs = {};
window.I2C = function () {
  this.reply = [];
  this.setup = (conf) => {
    window.i2cs[conf.sda.id] = this;
    console.log('setup software i2c', conf)
  }
  this.writeTo = (data) => { /* console.log('writing to i2c', data) */ }
  this.readFrom = (length) => { /* console.log('reading from i2c', length); */ return this.reply; }
}

const watches = {};
window.setWatch = (cb, pin, params) => {
  console.log(`set watch on D${pin.id}`, params);
  watches[pin.id + params.edge] = { cb, params };
}

window.digitalPulse = (pin, period) => {
  console.log(`digital pulse on ${pin.id}`, period);
}

window.analogRead = (pin) => {
  return 0.9;
}

// initialize pins
for (let i = 0; i < 48; i++) {
  window[`D${i}`] = {
    id: i,
    mode(mode) { console.log(`pin ${i} mode changed to`, mode) },
    write(value) { console.log(`pin ${i} value ${value}`) },
    read() { return 0 }
  };
}

window.process = {
  memory: () => ({
    total: 6000,
    usage: 1000,
  })
}

// ====== device-specific config ======

setTimeout(() => {
  const touch = window.i2cs[43];
  const touchWatch = watches['44falling'];

  document.querySelector('#offscreen').onclick = (e) => {
    touch.reply = [128, 0, e.offsetX, 0, e.offsetY, 0, 0, 0, 0, 0, 0, 0];
    touchWatch.cb();
  }

  document.body.onkeypress = ({ key }) => {
    if (key === 'q') {
      watches['16rising'].cb(); // button press
      watches['16falling'].cb(); // button press
    }
    if (key === 'w') {
      touch.reply = [128, 0, 120, 120, 0, 0, 0, 0, 0, 0, 4 * 2];
      touchWatch.cb();
    }
    if (key === 'a') {
      touch.reply = [128, 0, 120, 120, 0, 0, 0, 0, 0, 0, 5 * 2];
      touchWatch.cb();
    }
    if (key === 's') {
      touch.reply = [128, 0, 120, 120, 0, 0, 0, 0, 0, 0, 6 * 2];
      touchWatch.cb();
    }
    if (key === 'd') {
      touch.reply = [128, 0, 120, 120, 0, 0, 0, 0, 0, 0, 7 * 2];
      touchWatch.cb();
    }
  }
}, 1000);

window.BTN1 = D16;
window.LED1 = D22;

// ====================================

const fileCache = {
  ...modules,
}
window.require = (file) => {
  if (fileCache[file + '.js']) {
    file += '.js';
  }
  if (fileCache[file + '/index.js']) {
    file += '/index.js';
  }
  if (fileCache[file]) {
    if (!modules[file]) {
      window.module = { export: null };
      fileCache[file]();
      modules[file] = window.module.exports;
    }
    return modules[file];
  }
  console.error(`module ${file} not found`)
}