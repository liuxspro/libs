import { create_shp_zip } from "../src/shp.ts";
import { get_cgcs2000_wkt, Polygon, Ring } from "@liuxspro/libs/geo";

Deno.test("create_shp_zip", async function () {
  const record = { area: 0 };
  // 按顺时针排列的点
  const ring_clockwise = [
    [39547228.491, 3797916.479],
    [39547246.449, 3798076.324],
    [39547399.598, 3798062.844],
    [39547381.907, 3797655.744],
    [39546951.091, 3797694.864],
    [39546979.97, 3797942.755],
    [39547228.491, 3797916.479],
  ];
  // 逆时针排列的环
  const ring_counterclockwise = ring_clockwise.toReversed();
  // 逆时针的环
  const hole_counterclockwise = [
    [39547163.999907895922661, 3797857.179684211034328],
    [39547156.805776312947273, 3797784.684973684605211],
    [39547264.717749997973442, 3797777.490842105820775],
    [39547270.805092103779316, 3797848.878763158340007],
    [39547163.999907895922661, 3797857.179684211034328],
  ];

  const ring1 = new Ring(ring_clockwise); // 顺时针环
  const ring2 = new Ring(ring_counterclockwise); // 逆时针环
  const hole1 = new Ring(hole_counterclockwise); // 逆时针孔洞
  const hole2 = new Ring(hole_counterclockwise.toReversed()); // 顺时针孔洞

  const m1 = new Polygon([ring1, hole1]); // 顺时针环 + 逆时针空洞 (Arcmap标准)
  const m2 = new Polygon([ring2, hole2]); // 逆时针环 + 顺时针空洞 (Geojson标准)
  const prj = get_cgcs2000_wkt(39);

  const shp1 = await create_shp_zip(
    m1.to_multipolygon().ensure_esri_standard(),
    record,
    prj,
    "由顺时针方向创建的",
  );
  Deno.writeFileSync(
    "./tests/data/由顺时针方向创建的.zip",
    shp1,
  );

  const shp2 = await create_shp_zip(
    m2.to_multipolygon().ensure_esri_standard(),
    record,
    prj,
    "由逆时针方向创建的",
  );
  Deno.writeFileSync(
    "./tests/data/由逆时针方向创建的.zip",
    shp2,
  );
});
