/** Menggabungkan nama kelas, melewati nilai kosong. */
export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
