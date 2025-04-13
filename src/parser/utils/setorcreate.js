// helper to accumulate data in complex object structure which can be not created
export function setOrCreate(...params) {
  let obj = params.shift();
  const val = params.pop();
  const prop = params.pop();

  params.forEach((p) => {
    if (!obj[p]) obj[p] = {};
    obj = obj[p];
  });

  if (Array.isArray(val) || typeof val === "object") {
    obj[prop] = obj[prop] ?? val;
  } else {
    if (!obj[prop]) obj[prop] = 0;
    obj[prop] += val;
  }

  return obj;
}
