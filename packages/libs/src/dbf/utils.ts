export type FieldTypeSign = "C" | "N" | "L" | "D";
export enum FieldType {
  string = "C",
  number = "N",
  boolean = "L",
  Date = "D",
}

export function encode_text(content: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(content);
}

export function date_to_str(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份+1并补零
  const day = String(date.getDate()).padStart(2, "0"); // 日期补零
  const formattedDate = `${year}${month}${day}`;
  return formattedDate;
}

export function get_update_date(date: Date) {
  // const today = new Date();
  const year = date.getFullYear() - 1900;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return new Uint8Array([year, month, day]);
}
