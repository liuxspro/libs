import type { Fields } from "../src/dbf.ts";
import { create_bjwj } from "../src/bjwj.ts";
import { Ring } from "@liuxspro/libs/geo";
Deno.test("create_bjwj 创建边界文件", async function () {
  const record: Fields = {
    "DKMC": "1",
    "DKDM": "2",
    "XZQMC": "4",
    "XZQDM": "3",
    "YDMJ": 129068.42,
    "DH": 39,
    "SCRQ": null,
    "SCDW": null,
    "BZ": null,
  };
  const points = [
    [39547228.491, 3797916.479],
    [39547246.449, 3798076.324],
    [39547399.598, 3798062.844],
    [39547381.907, 3797655.744],
    [39546951.091, 3797694.864],
    [39546979.970, 3797942.755],
  ];
  const ring = new Ring(points);
  const prj =
    'PROJCS["CGCS2000_3_Degree_GK_Zone_39",GEOGCS["GCS_China_Geodetic_Coordinate_System_2000",DATUM["D_China_2000",SPHEROID["CGCS2000",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Gauss_Kruger"],PARAMETER["False_Easting",39500000.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",117.0],PARAMETER["Scale_Factor",1.0],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]';
  const bjwj = await create_bjwj(
    "初步调查",
    record,
    ring.to_multipolygon(),
    prj,
  );
  Deno.writeFileSync(
    "./tests/data/bjwj.zip",
    bjwj,
  );
});
