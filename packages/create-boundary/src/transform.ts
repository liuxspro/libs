import proj4 from "proj4";
import { get_digits } from "@liuxspro/libs/utils";
import type { Point } from "@liuxspro/geo";
import { get_cgcs2000_wkt, get_zone } from "@liuxspro/geo";

export function cgcs_to_lonlat(point: Point): Point {
  const x = point[0];
  const y = point[1];
  if (get_digits(x) == 8) {
    // 正常含带号的情况
    const dh = parseInt(x.toString().slice(0, 2));
    const wkt = get_cgcs2000_wkt(dh);
    return proj4(wkt).inverse([x, y]);
  } else {
    throw new Error("没有带号");
  }
}

export function lonlat_to_cgcs(point: Point): Point {
  const x = point[0];
  const y = point[1];
  const DH = get_zone(x);
  const wkt = get_cgcs2000_wkt(DH);
  return proj4(wkt).forward([x, y]);
}
