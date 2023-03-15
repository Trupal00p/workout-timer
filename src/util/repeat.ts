export function* repeat<Type>(item: Type, count: number): Iterable<Type> {
  let i = 1;
  while (i <= count) {
    yield item;
    i++;
  }
}
