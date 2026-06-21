export interface LookupOption {
  id: string;
  title: string;
}

type TreeNode = {
  id: string;
  title?: string;
  name?: string;
  children?: TreeNode[];
};

export function normalizeLookupText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[`'’"]/g, '')
    .replace(/[сc]/g, 'c')
    .replace(/[аa]/g, 'a')
    .replace(/[оo]/g, 'o')
    .replace(/[рp]/g, 'p')
    .replace(/[кk]/g, 'k')
    .replace(/[мm]/g, 'm')
    .replace(/[тt]/g, 't')
    .replace(/[вb]/g, 'b')
    .replace(/[хx]/g, 'x')
    .replace(/[нh]/g, 'h')
    .replace(/[іїйi]/g, 'i')
    .replace(/[єeе]/g, 'e')
    .replace(/[ґg]/g, 'g')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function flattenLookupTree(nodes: TreeNode[]): LookupOption[] {
  const result: LookupOption[] = [];

  for (const node of nodes) {
    result.push({
      id: node.id,
      title: node.title ?? node.name ?? '',
    });

    if (node.children?.length) {
      result.push(...flattenLookupTree(node.children));
    }
  }

  return result.filter((item) => item.title.trim() !== '');
}

export function findLookupIdByExactTitle(options: LookupOption[], title: string): string {
  const expected = normalizeLookupText(title);
  const matched = options.find((item) => normalizeLookupText(item.title) === expected);

  if (!matched) {
    throw new Error(`Не вдалося знайти lookup-значення за назвою "${title}"`);
  }

  return matched.id;
}

export function findLookupIdByContains(options: LookupOption[], text: string): string {
  const expected = normalizeLookupText(text);
  const matched = options.find((item) => normalizeLookupText(item.title).includes(expected));

  if (!matched) {
    throw new Error(`Не вдалося знайти lookup-значення, яке містить "${text}"`);
  }

  return matched.id;
}

export function buildRandomFutureDateIso(maxDaysAhead: number, now = new Date()): string {
  const offsetDays = Math.floor(Math.random() * maxDaysAhead) + 1;
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + offsetDays);
  return targetDate.toISOString().slice(0, 10);
}

export function buildOrderFormNumber(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}${day}${hours}${minutes}${seconds}`;
}
