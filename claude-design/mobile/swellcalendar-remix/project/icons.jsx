// Spectrum-style line icons (1.6px stroke, rounded)
const Ic = (() => {
  const S = (p) => React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }, React.Children.map(p, (c, i) => React.cloneElement(c, { key: i })));
  const P = (d) => React.createElement("path", { d });
  return {
    cal: () => S([React.createElement("rect", { key: 1, x: 3, y: 4.5, width: 18, height: 16, rx: 3 }), P("M3 9h18"), P("M8 2.5v4"), P("M16 2.5v4")]),
    day: () => S([React.createElement("rect", { key: 1, x: 4, y: 4.5, width: 16, height: 16, rx: 3 }), P("M4 9h16"), P("M12 13v4")]),
    week: () => S([React.createElement("rect", { key: 1, x: 3, y: 4.5, width: 18, height: 16, rx: 3 }), P("M3 9h18"), P("M9 9v11"), P("M15 9v11")]),
    month: () => S([React.createElement("rect", { key: 1, x: 3, y: 4.5, width: 18, height: 16, rx: 3 }), P("M3 9h18"), P("M9 9v11"), P("M15 9v11"), P("M3 14.5h18")]),
    sched: () => S([P("M3 6h4"), P("M3 12h4"), P("M3 18h4"), React.createElement("rect", { key: 1, x: 9, y: 4, width: 12, height: 4, rx: 1.5 }), React.createElement("rect", { key: 2, x: 9, y: 10, width: 8, height: 4, rx: 1.5 }), React.createElement("rect", { key: 3, x: 9, y: 16, width: 11, height: 4, rx: 1.5 })]),
    timeline: () => S([React.createElement("circle", { key: 1, cx: 6, cy: 6, r: 2 }), React.createElement("circle", { key: 2, cx: 6, cy: 12, r: 2 }), React.createElement("circle", { key: 3, cx: 6, cy: 18, r: 2 }), P("M6 8v2"), P("M6 14v2"), P("M11 6h10"), P("M11 12h10"), P("M11 18h10")]),
    plus: () => S([P("M12 5v14"), P("M5 12h14")]),
    chevL: () => S([P("M15 6l-6 6 6 6")]),
    chevR: () => S([P("M9 6l6 6-6 6")]),
    chevD: () => S([P("M6 9l6 6 6-6")]),
    search: () => S([React.createElement("circle", { key: 1, cx: 11, cy: 11, r: 7 }), P("M20 20l-3.5-3.5")]),
    bell: () => S([P("M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"), P("M13.7 21a2 2 0 0 1-3.4 0")]),
    settings: () => S([React.createElement("circle", { key: 1, cx: 12, cy: 12, r: 3 }), P("M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H2a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 3.6 6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H8a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z")]),
    clock: () => S([React.createElement("circle", { key: 1, cx: 12, cy: 12, r: 8.5 }), P("M12 7v5l3 2")]),
    pin: () => S([P("M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"), React.createElement("circle", { key: 1, cx: 12, cy: 10, r: 2.5 })]),
    users: () => S([P("M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19"), React.createElement("circle", { key: 1, cx: 10, cy: 8, r: 3.5 }), P("M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4"), P("M15.5 4.6a3.5 3.5 0 0 1 0 6.8")]),
    user: () => S([React.createElement("circle", { key: 1, cx: 12, cy: 8, r: 4 }), P("M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1")]),
    door: () => S([P("M4 21h16"), P("M6 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17"), React.createElement("circle", { key: 1, cx: 14, cy: 12, r: 1 })]),
    edit: () => S([P("M16.5 4.5l3 3L8 19l-4 1 1-4z")]),
    trash: () => S([P("M4 7h16"), P("M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"), P("M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13")]),
    check: () => S([P("M5 12.5l4.5 4.5L19 7")]),
    video: () => S([React.createElement("rect", { key: 1, x: 3, y: 6, width: 13, height: 12, rx: 2.5 }), P("M16 10l5-3v10l-5-3")]),
    repeat: () => S([P("M17 2l3 3-3 3"), P("M20 5H8a4 4 0 0 0-4 4v1"), P("M7 22l-3-3 3-3"), P("M4 19h12a4 4 0 0 0 4-4v-1")]),
    grid: () => S([React.createElement("rect", { key: 1, x: 3, y: 3, width: 7, height: 7, rx: 1.5 }), React.createElement("rect", { key: 2, x: 14, y: 3, width: 7, height: 7, rx: 1.5 }), React.createElement("rect", { key: 3, x: 3, y: 14, width: 7, height: 7, rx: 1.5 }), React.createElement("rect", { key: 4, x: 14, y: 14, width: 7, height: 7, rx: 1.5 })]),
    sidebar: () => S([React.createElement("rect", { key: 1, x: 3, y: 4.5, width: 18, height: 15, rx: 2.5 }), P("M9 4.5v15")]),
    filter: () => S([P("M3 5h18l-7 8v6l-4-2v-4z")]),
    inbox: () => S([P("M3 13h5l1.5 2.5h5L21 13"), P("M3 13l3-8h12l3 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z")]),
    star: () => S([P("M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z")]),
    swell: () => React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }, P("M2 13c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4")),
  };
})();
window.Ic = Ic;
