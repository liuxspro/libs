import JSZip from "jszip";

/**
 * 从 KMZ 文件中提取 KML 数据。
 *
 * 此函数接收一个表示 KMZ 文件二进制数据的 ArrayBuffer，使用 JSZip 库解压并读取其中的 "doc.kml" 文件，
 * 然后返回该文件的字符串内容。
 *
 * KMZ 文件是 KML（Keyhole Markup Language）文件的压缩格式，通常为 zip 存档，其中必须包含一个名为 "doc.kml" 的主文件。
 *
 * 如果输入数据不是有效的 KMZ 文件（例如，无效的 zip 格式），或者 zip 存档中缺少 "doc.kml" 文件，函数会抛出错误。
 *
 * @param {ArrayBuffer} buffer - 一个 ArrayBuffer，包含 KMZ 文件的原始二进制数据。
 *
 * @returns 一个 Promise，在解析成功时返回 KML 数据的字符串。字符串内容为 "doc.kml" 文件的文本。
 * @throws 如果 zip 存档为空或未找到名为 "doc.kml" 的文件，会抛出 Error，消息为 "KMZ 文件为空或未找到 doc.kml 文件"。
 *
 * @example
 * // 示例：从网络请求中提取 KML 数据
 * const response = await fetch('example.kmz');
 * const buffer = await response.arrayBuffer();
 * const kmlData = await get_kmldata_from_kmz(buffer);
 */
export async function get_kmldata_from_kmz(
  buffer: ArrayBuffer,
): Promise<string> {
  const zip = new JSZip();
  await zip.loadAsync(buffer);
  const kmlFile = zip.file("doc.kml");
  if (!kmlFile) {
    throw new Error("KMZ 文件为空或未找到 doc.kml 文件");
  }
  const kmlData = await kmlFile.async("string");
  return kmlData;
}
