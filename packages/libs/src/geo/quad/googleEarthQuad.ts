import { is_bit_set as isBitSet } from "./utils.ts";

interface TileXY {
  x: number;
  y: number;
  level: number;
}

/**
 * XYZ 转换为 Google Earth Quadkey
 * 转自 Cesium:
 * https://github.com/CesiumGS/cesium/blob/bcbf96162d64ba2462543169d5c6c7457751fa03/packages/engine/Source/Core/GoogleEarthEnterpriseMetadata.js#L191
 * @param x
 * @param y
 * @param level
 * @returns {string} quadkey
 */
const tileXYToQuadKey = function (
  x: number,
  y: number,
  level: number,
): string {
  let quadkey = "";
  for (let i = level; i >= 0; --i) {
    const bitmask = 1 << i;
    let digit = 0;

    // Tile Layout
    // ___ ___
    //|   |   |
    //| 3 | 2 |
    //|-------|
    //| 0 | 1 |
    //|___|___|
    //

    if (!isBitSet(y, bitmask)) {
      // Top Row
      digit |= 2;
      if (!isBitSet(x, bitmask)) {
        // Right to left
        digit |= 1;
      }
    } else if (isBitSet(x, bitmask)) {
      // Left to right
      digit |= 1;
    }

    quadkey += digit;
  }
  return quadkey;
};

/**
 * Google Earth Quadkey 转换为 XYZ
 * 转自 Cesium:
 * https://github.com/CesiumGS/cesium/blob/bcbf96162d64ba2462543169d5c6c7457751fa03/packages/engine/Source/Core/GoogleEarthEnterpriseMetadata.js#L231
 * @param quadkey
 * @returns
 */
const quadKeyToTileXY = function (quadkey: string): TileXY {
  let x = 0;
  let y = 0;
  const level = quadkey.length - 1;
  for (let i = level; i >= 0; --i) {
    const bitmask = 1 << i;
    const digit = +quadkey[level - i];

    if (isBitSet(digit, 2)) {
      // Top Row
      if (!isBitSet(digit, 1)) {
        // // Right to left
        x |= bitmask;
      }
    } else {
      y |= bitmask;
      if (isBitSet(digit, 1)) {
        // Left to right
        x |= bitmask;
      }
    }
  }
  return {
    x: x,
    y: y,
    level: level,
  };
};

/**
 * XYZ 转换为 Google Earth Quadkey
 * 修改以适应 WorldCRS84Quad 矩阵集
 * 注意 Z 从 2 开始才与 WorldCRS84Quad 匹配，即 width 为 4, height 为 2
 * @param x
 * @param y
 * @param z
 * @returns {string} quadkey 完整的quadkey(首位为0)
 */
export function xyz_to_quad(x: number, y: number, z: number): string {
  z -= 1;
  y = y + (1 << (z - 1));
  return "0" + tileXYToQuadKey(x, y, z);
}

/**
 * Google Earth Quadkey 转换为 XYZ
 * 修改以适应 WorldCRS84Quad 矩阵集
 * 注意 quad 需要从 030 开始
 * @param {string} quad
 * @returns {TileXY} XYZ
 */
export function quad_to_xyz(quad: string): TileXY {
  quad = quad.slice(1);
  const { x, y, level } = quadKeyToTileXY(quad);
  return {
    x: x,
    y: y - (1 << (level - 1)),
    level: level + 1,
  };
}
