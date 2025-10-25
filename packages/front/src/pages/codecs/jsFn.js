function Codec_decoder_func(decoder) {
  let obj = {};
  obj.foo = decoder.int();
  obj.bar = decoder.int();
  obj.name = ((decoder) => {
    const length = decoder.int();
    let str = '';
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(decoder.int());
    }
    return str;
  })(decoder);
  obj.notPresent = notPresent_optional_item_decoder_func(decoder);
  obj.optionalPresent = optionalPresent_optional_item_decoder_func(decoder);
  obj.nested = Nested_decoder_func(decoder);
  obj.arrOfInts = ((decoder) => {
    const arr = [];
    const length = decoder.int();
    for (let i = 0; i < length; i++) {
      arr.push(decoder.int());
    }
    return arr;
  })(decoder);
  obj.arrOfArrOfInts = ((decoder) => {
    const arr = [];
    const length = decoder.int();
    for (let i = 0; i < length; i++) {
      arr.push(
        ((decoder) => {
          const arr = [];
          const length = decoder.int();
          for (let i = 0; i < length; i++) {
            arr.push(decoder.int());
          }
          return arr;
        })(decoder)
      );
    }
    return arr;
  })(decoder);
  obj.arrOfCodecs = ((decoder) => {
    const arr = [];
    const length = decoder.int();
    for (let i = 0; i < length; i++) {
      arr.push(Hello_decoder_func(decoder));
    }
    return arr;
  })(decoder);
  obj.arrOfOptionals = ((decoder) => {
    const arr = [];
    const length = decoder.int();
    for (let i = 0; i < length; i++) {
      arr.push(arrOfOptionals_item_optional_item_decoder_func(decoder));
    }
    return arr;
  })(decoder);
  return obj;
}
function notPresent_optional_item_decoder_func(decoder) {
  const hasValue = decoder.int() === 1;
  if (hasValue) {
    return decoder.int();
  }
  return undefined;
}

function optionalPresent_optional_item_decoder_func(decoder) {
  const hasValue = decoder.int() === 1;
  if (hasValue) {
    return decoder.int();
  }
  return undefined;
}

function Nested_decoder_func(decoder) {
  let obj = {};
  obj.a = decoder.int();
  obj.b = decoder.int();
  return obj;
}
function Hello_decoder_func(decoder) {
  let obj = {};
  obj.hello = decoder.int();
  return obj;
}
function arrOfOptionals_item_optional_item_decoder_func(decoder) {
  const hasValue = decoder.int() === 1;
  if (hasValue) {
    return decoder.int();
  }
  return undefined;
}

return Codec_decoder_func(decoder);
