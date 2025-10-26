type Decoder = any;

export type Codec = {
  foo: number;
  bar: number;
  name: string;
  notPresent: number | undefined;
  optionalPresent: number | undefined;
  nested: Nested;
  arrOfInts: number[];
  arrOfArrOfInts: number[][];
  arrOfCodecs: Hello[];
  arrOfOptionals: number | undefined[];
};

function Codec_decoder_func(decoder: Decoder): Codec {
  let obj: any = {};
  obj.foo = decoder.int();
  obj.bar = decoder.int();
  obj.name = decoder.string();
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
function notPresent_optional_item_decoder_func(decoder: Decoder): number | undefined {
  const hasValue = decoder.int() === 1;
  if (hasValue) {
    return decoder.int();
  }
  return undefined;
}

function optionalPresent_optional_item_decoder_func(
  decoder: Decoder
): number | undefined {
  const hasValue = decoder.int() === 1;
  if (hasValue) {
    return decoder.int();
  }
  return undefined;
}

export type Nested = {
  a: number;
  b: number;
};

function Nested_decoder_func(decoder: Decoder): Nested {
  let obj: any = {};
  obj.a = decoder.int();
  obj.b = decoder.int();
  return obj;
}

export type Hello = {
  hello: number;
};

function Hello_decoder_func(decoder: Decoder): Hello {
  let obj: any = {};
  obj.hello = decoder.int();
  return obj;
}
function arrOfOptionals_item_optional_item_decoder_func(
  decoder: Decoder
): number | undefined {
  const hasValue = decoder.int() === 1;
  if (hasValue) {
    return decoder.int();
  }
  return undefined;
}

export default Codec_decoder_func;
export { Codec_decoder_func };
