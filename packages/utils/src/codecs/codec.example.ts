type Decoder = any;

export type Codec = {
  foo: number;
  bar: number;
  name: string;
  notPresent: number | undefined;
  optionalPresent: number | undefined;
  nested: Nested;
  arrOfInts: Array<number>;
  arrOfArrOfInts: Array<Array<number>>;
  arrOfCodecs: Array<Hello>;
  arrOfOptionals: Array<number | undefined>;
};

function Codec_decoder_func(decoder: Decoder): Codec {
  const obj = {} as Codec;
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
        })(decoder),
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
function notPresent_optional_item_decoder_func(
  decoder: Decoder,
): number | undefined {
  const hasValue = decoder.int() === 1;
  if (hasValue) {
    return decoder.int();
  }
  return undefined;
}

function optionalPresent_optional_item_decoder_func(
  decoder: Decoder,
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
  const obj = {} as Nested;
  obj.a = decoder.int();
  obj.b = decoder.int();
  return obj;
}

export type Hello = {
  hello: number;
};

function Hello_decoder_func(decoder: Decoder): Hello {
  const obj = {} as Hello;
  obj.hello = decoder.int();
  return obj;
}
function arrOfOptionals_item_optional_item_decoder_func(
  decoder: Decoder,
): number | undefined {
  const hasValue = decoder.int() === 1;
  if (hasValue) {
    return decoder.int();
  }
  return undefined;
}

export { Codec_decoder_func as moduleDecoder };

type Encoder = any;
function Codec_encoder_fn(encoder: Encoder, obj: Codec): Encoder {
  encoder.int(obj.foo);
  encoder.int(obj.bar);
  {
    const str = obj.name;
    encoder.int(str.length);
    for (let i = 0; i < str.length; i++) {
      encoder.int(str.charCodeAt(i));
    }
  }
  {
    const hasValue = obj.notPresent != null;
    encoder.int(hasValue ? 1 : 0);
    if (hasValue) {
      encoder.int(obj.notPresent);
    }
  }
  {
    const hasValue = obj.optionalPresent != null;
    encoder.int(hasValue ? 1 : 0);
    if (hasValue) {
      encoder.int(obj.optionalPresent);
    }
  }
  Nested_encoder_fn(encoder, obj.nested);
  {
    encoder.int(obj.arrOfInts.length);
    const arr = obj.arrOfInts;
    arr.forEach((item: any) => {
      encoder.int(item);
    });
  }
  {
    encoder.int(obj.arrOfArrOfInts.length);
    const arr = obj.arrOfArrOfInts;
    arr.forEach((item: any) => {
      {
        encoder.int(item.length);
        const arr = item;
        arr.forEach((item: any) => {
          encoder.int(item);
        });
      }
    });
  }
  {
    encoder.int(obj.arrOfCodecs.length);
    const arr = obj.arrOfCodecs;
    arr.forEach((item: any) => {
      Hello_encoder_fn(encoder, item);
    });
  }
  {
    encoder.int(obj.arrOfOptionals.length);
    const arr = obj.arrOfOptionals;
    arr.forEach((item: any) => {
      {
        const hasValue = item != null;
        encoder.int(hasValue ? 1 : 0);
        if (hasValue) {
          encoder.int(item);
        }
      }
    });
  }
  return encoder;
}
function Nested_encoder_fn(encoder: Encoder, obj: Nested): Encoder {
  encoder.int(obj.a);
  encoder.int(obj.b);
  return encoder;
}
function Hello_encoder_fn(encoder: Encoder, obj: Hello): Encoder {
  encoder.int(obj.hello);
  return encoder;
}
export { Codec_encoder_fn as moduleEncoder };
