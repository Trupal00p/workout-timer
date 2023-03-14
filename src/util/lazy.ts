function* take(iter: Iterable<any>, count: number) {
  for (const x of iter) {
    if (count-- <= 0) {
      return;
    }
    yield x;
  }
}

type mappingFunction = (x: any) => any;

function* map(iter: Iterable<any>, func: mappingFunction) {
  for (const x of iter) {
    // console.log(`map called`);
    yield func(x);
  }
}

type filteringFunction = (x: any) => boolean;

function* filter(iter: Iterable<any>, filterFunc: filteringFunction) {
  for (const x of iter) {
    if (filterFunc(x)) {
      //   console.log(`filter called`);
      yield x;
    }
  }
}

function* allOf(iter: Iterable<any>) {
  for (let x of iter) {
    yield x;
  }
}

export function lazy(arr: Array<any>) {
  const api = {
    previousGenerator: allOf(arr),
    map(mapFunc: mappingFunction) {
      this.previousGenerator = map(this.previousGenerator, mapFunc);
      return this;
    },
    filter(filterFunc: filteringFunction) {
      this.previousGenerator = filter(this.previousGenerator, filterFunc);
      return this;
    },
    take(count: number) {
      this.previousGenerator = take(this.previousGenerator, count);
      return this;
    },
    collect() {
      return [...this.previousGenerator];
    },
    join(sep: string) {
      return [...this.previousGenerator].join(sep);
    },
    [Symbol.iterator]() {
      return this.previousGenerator;
    },
  };
  return api;
}
