const ScaleDenominatorList = [
  559082264.0287178, 279541132.0143589, 139770566.00717944, 69885283.00358972,
  34942641.50179486, 17471320.75089743, 8735660.375448715, 4367830.1877243575,
  2183915.0938621787, 1091957.5469310894, 545978.7734655447, 272989.38673277234,
  136494.69336638617, 68247.34668319309, 34123.67334159654, 17061.83667079827,
  8530.918335399136, 4265.459167699568, 2132.729583849784, 1066.364791924892,
  533.182395962446, 266.591197981223,
];

export function create_TileMatrixs(min: number = 0, max: number = 18): string {
  let matrixs = "";
  for (let i = min; i <= max; i++) {
    matrixs += `      <TileMatrix>
          <ows:Identifier>${i}</ows:Identifier>
          <ScaleDenominator>${ScaleDenominatorList[i]}</ScaleDenominator>
          <TopLeftCorner>-20037508.3427892 20037508.3427892</TopLeftCorner>
          <TileWidth>256</TileWidth>
          <TileHeight>256</TileHeight>
          <MatrixWidth>${1 << i}</MatrixWidth>
          <MatrixHeight>${1 << i}</MatrixHeight>
        </TileMatrix>
  `;
  }
  return matrixs;
}

export function create_TileMatrixSet(
  title: string,
  identifier: string,
  matrixs: string
): string {
  return `<TileMatrixSet>
        <ows:Title>${title}</ows:Title>
        <ows:Identifier>${identifier}</ows:Identifier>
        <ows:SupportedCRS>urn:ogc:def:crs:EPSG:6.18.3:3857</ows:SupportedCRS>
        <WellKnownScaleSet>urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible</WellKnownScaleSet>
        ${matrixs.trim()}
      </TileMatrixSet>
  `;
}

export function create_webmercator_MatrixSet(zmin: number, zmax: number) {
  const GLOBAL_WEBMERCATOR_Matrixs = create_TileMatrixs(zmin, zmax);
  return create_TileMatrixSet(
    "Google Maps Compatible for the World",
    "GLOBAL_WEBMERCATOR",
    GLOBAL_WEBMERCATOR_Matrixs
  );
}

export function crate_identification(title: string, abstract: string) {
  return `<ows:ServiceIdentification>
      <ows:Title>${title}</ows:Title>
      <ows:Abstract>${abstract}</ows:Abstract>
      <ows:ServiceType>OGC WMTS</ows:ServiceType>
      <ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>
      <ows:Fees>none</ows:Fees>
      <ows:AccessConstraints>none</ows:AccessConstraints>
    </ows:ServiceIdentification>
  `;
}

/**
 * 创建 Layer
 * @param title Layer Title
 * @param abstract Layer Abstract
 * @param identifier Layer Identifier
 * @param template Layer Template URL
 * @returns Layer xml data
 */
export function create_layer(
  title: string,
  abstract: string,
  identifier: string,
  template: string
) {
  return `<Layer>
        <ows:Title>${title}</ows:Title>
        <ows:Abstract>${abstract}</ows:Abstract>
        <ows:WGS84BoundingBox>
          <ows:LowerCorner>-180.0 -85.051129</ows:LowerCorner>
          <ows:UpperCorner>180.0 85.051129</ows:UpperCorner>
        </ows:WGS84BoundingBox>
        <ows:Identifier>${identifier}</ows:Identifier>
        <Style>
          <ows:Identifier>default</ows:Identifier>
        </Style>
        <Format>image/png</Format>
        <TileMatrixSetLink>
          <TileMatrixSet>GLOBAL_WEBMERCATOR</TileMatrixSet>
        </TileMatrixSetLink>
        <ResourceURL format="image/png" resourceType="tile"
          template="${template}" />
      </Layer>`;
}

export function create_capabilities(
  identification: string,
  layer: string,
  matrix: string
): string {
  return `
  <Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1"
      xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xmlns:gml="http://www.opengis.net/gml"
      xsi:schemaLocation="http://www.opengis.net/wmts/1.0 http://schemas.opengis.net/wmts/1.0/wmtsGetCapabilities_response.xsd"
      version="1.0.0">
    ${identification.trim()}
    <Contents>
      ${layer}
      ${matrix.trim()}
    </Contents>
  </Capabilities>`;
}
