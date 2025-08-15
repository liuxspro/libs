const CGCS2000_3_Degree_Zone_List = [
  25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
  44, 45,
] as const;
type CGCS2000_3_Degree_Zone = (typeof CGCS2000_3_Degree_Zone_List)[number];

/**
 * 返回带号对应的 ESRI WKT
 * @param zone 3度带带号，25~45
 * @returns ESRI WKT
 *
 * https://epsg.io/4527
 *
 */
export function getEsriWKT_3_Degree(zone: CGCS2000_3_Degree_Zone): string {
  const PROJCS_name = `CGCS2000_3_Degree_GK_Zone_${zone}`;
  const GEOGCS_name = "GCS_China_Geodetic_Coordinate_System_2000";
  const GEOGCS = `GEOGCS["${GEOGCS_name}",DATUM["D_China_2000",SPHEROID["CGCS2000",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]`;
  const East = zone * 1000000 + 500000;
  const cm = 75 + (zone - 25) * 3; // Central_Meridian
  const PROJECTION = `PROJECTION["Gauss_Kruger"],PARAMETER["False_Easting",${East}.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",${cm}.0],PARAMETER["Scale_Factor",1.0],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]`;
  return `PROJCS["${PROJCS_name}",${GEOGCS},${PROJECTION}]`;
}
