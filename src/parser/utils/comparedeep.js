// very simple deep compare. probably will fail with complex structures
// should work with simple objects, array, strings and numbers
export function compareDeep(a, b, throwOnError) {
  if (typeof a == "string" || typeof a == "number") {
    if (throwOnError && a !== b) {
      throw new Error(`values not equal: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
    }

    return a === b;
  }

  if (Array.isArray(a)) {
    if (throwOnError && a.length !== b.length) {
      throw new Error(`array length not equal: ${a.length} != ${b.length}`);
    }

    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      try {
        if (!compareDeep(a[i], b[i], throwOnError)) {
          return false;
        }
      } catch (e) {
        throw new Error(e.message + `\narray index: ${i}`);
      }
    }

    return true;
  }

  let keys = Object.keys(a).sort();
  let keys2 = Object.keys(b).sort();
  try {
    if (!compareDeep(keys, keys2, throwOnError)) {
      return false;
    }
  } catch (e) {
    throw new Error(e.message + `\ncomparing objects keys`);
  }

  for (let i = 0; i < keys.length; i++) {
    if (throwOnError && !Object.hasOwn(b, keys[i])) {
      throw new Error(`B does not have property: ${JSON.stringify(keys[i])}`);
    }

    if (!Object.hasOwn(b, keys[i])) {
      return false;
    }

    try {
      if (!compareDeep(a[keys[i]], b[keys[i]], throwOnError)) {
        return false;
      }
    } catch (e) {
      throw new Error(e.message + `\ncomparing obj prop: ${keys[i]}`);
    }
  }

  return true;
}
