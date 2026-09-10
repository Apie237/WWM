const COMBINING_MARKS = /[̀-ͯ]/g;

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
