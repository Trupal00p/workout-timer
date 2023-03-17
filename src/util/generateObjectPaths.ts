export function* generateObjectPaths(
  data: any,
  path = "",
  delimiter = "/"
): Iterable<string> {
  if (Object(data) !== data) {
    // leaf node
    yield path;
  } else if (Array.isArray(data)) {
    // array node
    let i = 0;
    for (const v of data) {
      yield* generateObjectPaths(v, `${path}${delimiter}${i}`);
      i++;
    }
  } else {
    // object node
    for (const [k, v] of Object.entries(data)) {
      yield* generateObjectPaths(v, `${path}${delimiter}${k}`);
    }
  }
}
