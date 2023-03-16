export function* repeat<Type>(
  item: Type,
  count: number
): Iterable<[number, Type]> {
  let i = 1;
  while (i <= count) {
    yield [i, item];
    i++;
  }
}
