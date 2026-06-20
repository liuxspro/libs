import { Control } from "ol/control";
import type Map from "ol/Map.js";
import svgs from "./svg.ts";
export { svgs };

interface INorthArrowOptions {
  width?: string;
  style?: string;
  target?: HTMLElement;
}

class NorthArrow extends Control {
  /** @internal 保存 bound 引用以便解绑 */
  private _boundSyncRotation: () => void;

  /** @internal 保存 bound 引用以便解绑 */
  private _boundResetRotation: () => void;

  constructor(opt_options: INorthArrowOptions) {
    const options = opt_options || {};
    const width = options["width"] || "64px";
    const north_style = options["style"] || "1";
    const northArrowSvg = svgs[north_style];

    const element = document.createElement("div");
    element.className = "ol-north-arrow";
    element.style.width = width;
    element.style.position = "absolute";
    element.style.right = "15px";
    element.style.top = "15px";
    element.style.cursor = "pointer";
    element.innerHTML = northArrowSvg;

    super({
      element: element,
      target: options.target,
    });

    this._boundSyncRotation = this.syncRotation.bind(this);
    this._boundResetRotation = this.resetRotation.bind(this);

    element.addEventListener("click", this._boundResetRotation, false);
  }

  /** 切换指北针样式 */
  setStyle(styleName: string) {
    const svg = svgs[styleName];
    if (svg) {
      this.element.innerHTML = svg;
    }
  }

  /** 将指北针旋转至与地图当前旋转角度同步 */
  syncRotation() {
    const rotate_value = this.getMap()?.getView().getRotation();
    this.element.style.transform = `rotate(${rotate_value}rad)`;
  }

  /** 重置地图旋转并带动画 */
  resetRotation() {
    this.getMap()?.getView().animate({ rotation: 0, duration: 200 });
  }

  override setMap(map: Map) {
    // 解绑旧地图的监听
    const oldMap = this.getMap();
    if (oldMap) {
      oldMap.getView().un("change:rotation", this._boundSyncRotation);
    }

    super.setMap(map);

    if (map) {
      map.getView().on("change:rotation", this._boundSyncRotation);
      // 初始化时立即同步当前旋转状态
      this.syncRotation();
    }
  }
}

export default NorthArrow;
export type { INorthArrowOptions };
