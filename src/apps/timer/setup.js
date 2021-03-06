const fb = require('fb');
const st = require('Storage');
const SETTINGS = require('./src/globals');
const Watch = require('./src/ID205L');

const big = st.readArrayBuffer('metropolis-medium.72.f');
const icons = st.readArrayBuffer('icons.i');
const font = st.readArrayBuffer('metropolis-medium.18.f');

const start = (navigate) => {
  const fill2 = a => a < 10 ? `0${a}` : `${a}`;

  if (SETTINGS.NEXT_TIMER) {
    setTimeout(() => navigate(2), 1);
    return { onStop: () => { } };
  }

  const COLOR_BR = fb.color(0xFF, 0x61, 0x00);

  let hh = 0;
  let mm = 15;

  const ui = [
    fb.add({ x: 70, y: 70, w: 1, c: COLOR_BR, buf: big, index: `00` }),
    fb.add({ x: 170, y: 70, w: 1, c: COLOR_BR, buf: big, index: `15` }),
    fb.add({ x: 70, y: 30, w: 1, c: 0xffff, buf: icons, index: 8 }),
    fb.add({ x: 170, y: 30, w: 1, c: 0xffff, buf: icons, index: 8 }),
    fb.add({ x: 70, y: 155, w: 1, c: 0xffff, buf: icons, index: 9 }),
    fb.add({ x: 170, y: 155, w: 1, c: 0xffff, buf: icons, index: 9 }),
    fb.add({ x: 70, y: 132, w: 1, c: 0xffff, buf: font, index: 'hours' }),
    fb.add({ x: 170, y: 132, w: 1, c: 0xffff, buf: font, index: 'mins' }),
    fb.add({ x: 240 - 12, y: 212, c: 0xffff, w: 2, buf: font, index: 'start' }),
  ];

  const onTap = (e) => {
    const mod = e.y > 100 ? -1 : 1;
    if (e.y > 200) {
      Watch.vibrate([50, 50, 50]);
      SETTINGS.NEXT_TIMER = new Date().getTime() + (1000 * 60 * (mm + 60 * hh));
      navigate(2); // go to active page
      return;
    }
    if (e.x < 100) {
      hh += mod;
      if (hh > 99) { hh = 99; return; }
      if (hh < 0) { hh = 0; return; }
    } else {
      if (mod > 0) {
        if (mm == 59) {
          if (hh == 99) return;
          mm = 0; hh++;
        } else {
          mm++;
        }
      } else {
        if (mm <= 1 && hh == 0) return;
        if (mm == 0) {
          mm = 59;
          hh--;
        } else {
          mm--;
        }
      }
    }
    Watch.vibrate(30);
    fb.set(ui[0], { index: fill2(hh) });
    fb.set(ui[1], { index: fill2(mm) });
  };
  const onLongTap = (e) => {
    if (e.y > 200) return;
    if (e.y > 100) {
      if (mm == 0) return;
      if (hh === 0 && mm == 1) return;
      mm -= (mm % 10 === 0) ? 10 : mm % 10;
      if (hh === 0 && mm == 0) { mm = 1 };
    } else {
      if (mm == 59) return;
      mm += (mm % 10 === 0) ? 10 : (10 - mm % 10);
      if (mm > 59) { mm = 59 };
    }
    Watch.vibrate(30);
    fb.set(ui[0], { index: fill2(hh) });
    fb.set(ui[1], { index: fill2(mm) });
  }
  return {
    onLongTap: onLongTap,
    onTap: onTap,
    onStop: () => {
      ui.forEach(u => fb.remove(u));
    },
  };
}

module.exports = start;