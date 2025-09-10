type point = [number, number];

/**
 * 将角度转换为弧度。
 * @param degree 角度值
 * @returns 弧度值
 */
function degree_to_radius(degree: number): number {
  return (degree * Math.PI) / 180;
}

/**
 * 将弧度转换为角度。
 * @param radius 弧度值
 * @returns 角度值
 */
function radius_to_degree(radius: number): number {
  return (radius * 180) / Math.PI;
}

/**
 * 将WGS84坐标（经纬度）转换为墨卡托投影坐标。
 * @param coordinate [经度, 纬度]
 * @returns [x, y] 墨卡托投影坐标
 */
export function wgs84_to_mercator(coordinate: point): point {
  // https://en.wikipedia.org/wiki/Mercator_projection
  const [longitude, latitude] = coordinate;
  const R = 6378137;
  const x = R * degree_to_radius(longitude);
  const y = R *
    Math.log(Math.tan(Math.PI / 4 + degree_to_radius(latitude) / 2));
  return [x, y];
}

/**
 * 将墨卡托投影坐标转换为WGS84坐标（经纬度）。
 * @param coordinate [x, y] 墨卡托投影坐标
 * @returns [经度, 纬度] WGS84坐标
 */
export function mercator_to_wgs84(coordinate: point): point {
  // https://en.wikipedia.org/wiki/Mercator_projection
  const [x, y] = coordinate;
  const R = 6378137;
  const longitude = radius_to_degree(x / R);
  const latitude = radius_to_degree(
    2 * Math.atan(Math.exp(y / R)) - Math.PI / 2,
  );
  return [longitude, latitude];
}
