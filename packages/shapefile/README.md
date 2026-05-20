# shapefile

基于 [@mapbox/shp-write](https://www.npmjs.com/package/@mapbox/shp-write) 的 Deno 封装。

从坐标数组直接生成 shapefile 并打包为 ZIP。

## 用法

```ts
import { Shapefile } from "shapefile";

// 点
const shp = await Shapefile.from_points(
  [[120, 30], [121, 31]],
  [{ name: "A" }, { name: "B" }],
);

// 打包 ZIP 并保存
const zipBytes = await shp.to_zip("my_points");
await Deno.writeFile("my_points.zip", zipBytes);
```

## API

### 工厂方法

```ts
// 点 — 每个元素 [x, y]
Shapefile.from_points(coords: [number, number][], properties?, prj?, cpg?)

// 折线 — 每条线是一个坐标数组，支持 LineString / MultiLineString
Shapefile.from_polyline(coords: (Point[] | Point[][])[], properties?, prj?, cpg?)

// 面 — 每个面是环组，支持 Polygon / MultiPolygon
Shapefile.from_polygon(coords: (Point[][] | Point[][][])[], properties?, prj?, cpg?)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `coords` | 见上 | — | 坐标数据，每条记录对应一个 feature |
| `properties` | `PropertiesRow[]` | `[]` | 属性行，每项一个 feature；为空时自动填充空对象 |
| `prj` | `string` | WGS84 | 投影定义 WKT 字符串 |
| `cpg` | `string` | `"UTF-8"` | 编码声明 |

> `coords.length` 必须等于 `properties.length`，否则会抛出异常。

### 实例方法

```ts
// 打包为 ZIP，返回 Uint8Array
shp.to_zip(filename: string, folder?: string): Promise<Uint8Array>
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `filename` | `string` | — | 文件名（不含后缀），如 `"export"` → `export.shp` |
| `folder` | `string` | `""` | ZIP 内子文件夹名，空则放在根目录 |

### 类型

```ts
type PropertiesRow = Record<string, string | number | boolean>;
```

## License

MIT
