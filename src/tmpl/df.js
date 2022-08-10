  // Super minimalistic `def()` function for assigning data descriptors only.
  function df(obj, name, value)
  {
    return Object.defineProperty(obj, name, {value});
  }
  