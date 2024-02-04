import Player, { Popover } from "nplayer";
import Hls from "hls.js";
import "./styles.css";

if (!window.player) {
  // 1. 首先创建一个控制条项
  const Quantity = {
    el: document.createElement("div"),
    init() {
      this.btn = document.createElement("div");
      this.btn.textContent = "画质";
      this.el.appendChild(this.btn);
      this.popover = new Popover(this.el);
      this.btn.addEventListener("click", () => this.popover.show());
      // 点击按钮的时候展示 popover
      this.el.style.display = "none";
      // 默认隐藏
      this.el.classList.add("quantity");
    }
  };

  // 2. 我们把它放到 spacer 后面
  window.player = new Player({
    controls: [
      [
        "play",
        "volume",
        "time",
        "spacer",
        Quantity,
        "airplay",
        "settings",
        "web-fullscreen",
        "fullscreen"
      ],
      ["progress"]
    ],
    // 覆盖默认小屏布局为空。你可以自定义不同尺寸的布局
    // 文档， https://nplayer.js.org/docs/responsive/
    bpControls: {}
  });

  // 3. 创建 HLS 实例
  const hls = new Hls();
  hls.on(Hls.Events.MEDIA_ATTACHED, function () {
    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      // 4. 给清晰度排序，清晰度越高的排在最前面
      hls.levels.sort((a, b) => b.height - a.height);
      const frag = document.createDocumentFragment();
      // 5. 给与清晰度对应的元素添加，点击切换清晰度功能
      const listener = (i) => (init) => {
        const last = Quantity.itemElements[Quantity.itemElements.length - 1];
        const prev = Quantity.itemElements[Quantity.value] || last;
        const el = Quantity.itemElements[i] || last;
        prev.classList.remove("quantity_item-active");
        el.classList.add("quantity_item-active");
        Quantity.btn.textContent = el.textContent;
        if (init !== true && !window.player.paused)
          setTimeout(() => window.player.play());
        // 因为 HLS 切换清晰度会使正在播放的视频暂停，我们这里让它再自动恢复播放
        Quantity.value = hls.currentLevel = hls.loadLevel = i;
        Quantity.popover.hide();
      };
      // 6. 添加清晰度对应元素
      Quantity.itemElements = hls.levels.map((l, i) => {
        const el = document.createElement("div");
        el.textContent = l.name + "P";
        if (l.height === 1080) el.textContent += " 超清";
        if (l.height === 720) el.textContent += " 高清";
        if (l.height === 480) el.textContent += " 清晰";
        el.classList.add("quantity_item");
        el.addEventListener("click", listener(i));
        frag.appendChild(el);
        return el;
      });

      const el = document.createElement("div");
      el.textContent = "自动";
      el.addEventListener("click", listener(-1));
      el.classList.add("quantity_item");
      frag.appendChild(el);
      Quantity.itemElements.push(el);
      // 这里再添加一个 `自动` 选项，HLS 默认是根据网速自动切换清晰度

      Quantity.popover.panelEl.appendChild(frag);
      Quantity.el.style.display = "block";

      listener(hls.currentLevel)(true);
      // 初始化当前清晰度
    });

    // 绑定 video 元素成功的时候，去加载视频
    hls.loadSource("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
  });

  hls.attachMedia(window.player.video);
  window.player.mount("#app");
}
