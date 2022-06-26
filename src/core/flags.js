//++ core/flags ++//

function setFlag(flags, flag, value=true)
{
  if (typeof flags !== N) throw new TypeError("Flags must be number");
  if (typeof flag !== N) throw new TypeError("Flag must be number");

  if (value)
    flags = flags | flag;
  else
   flags = flags - (flags & flag);

  return flags;
}

function allFlags()
{
  const flags = 0;
  for (const arg of arguments)
  {
    if (typeof arg !== N)
    {
      throw new TypeError("Arguments must be numbers");
    }
    flags = flags | arg;
  }
  return flags;
}

//-- core/flags --//
