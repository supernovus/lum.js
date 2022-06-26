//++ core/typechecks ++//

const root = init.root;

function NYI(fatal=true) 
{ 
  const msg = "Not yet implemented";
  if (fatal)
    throw new Error(msg);
  else
    console.error(msg);
}

// A few quick private constants for tests.
const O='object', F='function', S='string', B='boolean', N='number',
      U='undefined', SY='symbol', BI='bigint', ARG='arguments', NULL='null';

// Javascript types as returned by `typeof` operator.
const JS_TYPES = [O, B, N, BI, S, SY, F, U];

// Special types that require different tests.
const SPECIAL_TYPES = [ARG, NULL];

// Check for non-null objects (i.e. not null).
function isObj(v) { return (typeof v === O && v !== null); }

// Check for a "complex" value (i.e. object or function).
function isComplex(v) { return (typeof v === F || isObj(v)); }

// A function to check if a value is undefined or null.
function isNil(v) { return (v === undefined || v === null); }

// A function to check for any non-null, non-undefined value.
function notNil(v) { return (v !== undefined && v !== null); }

// Check for a scalar value (i.e. not complex, not nil.)
function isScalar(v) { return (notNil(v) && !isComplex(v)); }

// A function to check for non-empty Arrays.
function nonEmptyArray(array)
{
  return (Array.isArray(array) && array.length > 0);
}

// A function to check if passed object is an Arguments object.
function isArguments(item) 
{
  return Object.prototype.toString.call(item) === '[object Arguments]';
}

// See if an object is an instance.
function isInstance(v, what, needProto=false) 
{
  if (!isObj(v)) return false; // Not an object.
  if (needProto && (typeof v.prototype !== O || v.prototype === null))
  { // Has no prototype.
    return false;
  }

  if (typeof what !== F || !(v instanceof what)) return false;

  // Everything passed.
  return true;
}

// Require an object, or throw an error.
function needObj (v, allowFunc=false, msg=null)
{
  if (allowFunc && isComplex(v)) return;
  if (isObj(v)) return;

  if (typeof msg !== S)
  { // Use a default message.
    msg = "Invalid object";
    if (allowFunc)
      msg += " or function";
  }
  throw new TypeError(msg);
}

// Need a value of a certain type or throw an error.
function needType (type, v, allowNull=false, msg=null)
{
  if (typeof type !== S 
    || (!JS_TYPES.includes(type) && !SPECIAL_TYPES.includes(type)))
  {
    throw new TypeError(`Invalid type ${JSON.stringify(type)} specified`);
  }

  if (typeof allowNull === S && msg === null)
  { // Message was passed without allowNull.
    msg = allowNull;
    allowNull = false;
  }
  
  if (!allowNull && type === O)
  { // Pass it on to needObj() which rejects null.
    return needObj(v, false, msg);
  }

  if (type === NULL && v === null) return; // It was null.
  if (type === ARG && isArguments(v)) return; // It was an 'arguments' object.
  if (typeof v === type) return; // We're good to go.

  if (typeof msg !== S)
  { // Use a default message.
    msg = `Invalid ${type} value`;
  }

  throw new TypeError(msg);
}

//-- core/typechecks --//
