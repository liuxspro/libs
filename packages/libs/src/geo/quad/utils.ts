export function is_bit_set(bits: number, mask: number) {
  return (bits & mask) !== 0;
}
