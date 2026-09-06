import { DBF, Field } from "@liuxspro/libs/dbf";

const DKMC = new Field("DKMC", "C", 254);
const DKDM = new Field("DKDM", "C", 100);
const XZQDM = new Field("XZQDM", "C", 12);
const XZQMC = new Field("XZQMC", "C", 100);
const YDMJ = new Field("YDMJ", "N", 16, 2);
const DH = new Field("DH", "N", 16);
const SCRQ = new Field("SCRQ", "D");
const SCDW = new Field("SCDW", "C", 254);
const BZ = new Field("BZ", "C", 254);

// 边界文件字段列表
const BJ_FIELDS = [DKMC, DKDM, XZQDM, XZQMC, YDMJ, DH, SCRQ, SCDW, BZ];

/**
 * 边界文件字段信息
 */
export interface Fields {
  DKMC: string;
  DKDM: string;
  XZQDM: string;
  XZQMC: string;
  YDMJ: number;
  DH: number;
  SCRQ: Date | null;
  SCDW: string | null;
  BZ: string | null;
}

/**
 * 根据字段信息创建 DBF 文件
 * @param {Fields} fields 字段信息
 * @returns {Uint8Array} DBF 文件内容
 */
export function create_dbf(fields: Fields): Uint8Array {
  let { DKMC, DKDM, XZQDM, XZQMC, YDMJ, DH, SCRQ, SCDW, BZ } = fields;
  if (SCRQ !== null) {
    SCRQ = new Date(SCRQ);
  }
  const record = [DKMC, DKDM, XZQDM, XZQMC, YDMJ, DH, SCRQ, SCDW, BZ];
  const dbf = new DBF(BJ_FIELDS, [record]);
  return dbf.data;
}
