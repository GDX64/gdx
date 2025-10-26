type Decoder = any;
type Encoder = any;

export type ExampleArray = {
  examples: Array<TestCodec>;
};

export type TestCodec = {
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

export type Nested = {
  a: number;
  b: number;
};

export type Hello = {
  hello: number;
};

function ExampleArray_decoder_func(decoder: Decoder): ExampleArray {
  const obj: ExampleArray = {
    examples: ExampleArrayItems_array_item_decoder_func(decoder),
  };
  return obj;
}

function ExampleArrayItems_array_item_decoder_func(
  decoder: Decoder,
): Array<TestCodec> {
  const length = decoder.int();
  const arr = new Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = TestCodec_decoder_func(decoder);
  }
  return arr;
}
function TestCodec_decoder_func(decoder: Decoder): TestCodec {
  const obj: TestCodec = {
    foo: decoder.int(),
    bar: decoder.int(),
    name: decoder.string(),
    notPresent: notPresent_optional_item_decoder_func(decoder),
    optionalPresent: optionalPresent_optional_item_decoder_func(decoder),
    nested: Nested_decoder_func(decoder),
    arrOfInts: IntArray_array_item_decoder_func(decoder),
    arrOfArrOfInts: ArrOfIntArray_array_item_decoder_func(decoder),
    arrOfCodecs: HelloArray_array_item_decoder_func(decoder),
    arrOfOptionals: ArrOfOptionals_array_item_decoder_func(decoder),
  };
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

function Nested_decoder_func(decoder: Decoder): Nested {
  const obj: Nested = {
    a: decoder.int(),
    b: decoder.int(),
  };
  return obj;
}

function IntArray_array_item_decoder_func(decoder: Decoder): Array<number> {
  const length = decoder.int();
  const arr = new Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = decoder.int();
  }
  return arr;
}

function ArrOfIntArray_array_item_decoder_func(
  decoder: Decoder,
): Array<Array<number>> {
  const length = decoder.int();
  const arr = new Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = IntArray_array_item_decoder_func(decoder);
  }
  return arr;
}

function HelloArray_array_item_decoder_func(decoder: Decoder): Array<Hello> {
  const length = decoder.int();
  const arr = new Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = Hello_decoder_func(decoder);
  }
  return arr;
}
function Hello_decoder_func(decoder: Decoder): Hello {
  const obj: Hello = {
    hello: decoder.int(),
  };
  return obj;
}

function ArrOfOptionals_array_item_decoder_func(
  decoder: Decoder,
): Array<number | undefined> {
  const length = decoder.int();
  const arr = new Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = arrOfOptionals_item_optional_item_decoder_func(decoder);
  }
  return arr;
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

export { ExampleArray_decoder_func as moduleDecoder };

function ExampleArray_encoder_fn(encoder: Encoder, obj: ExampleArray): Encoder {
  {
    encoder.int(obj.examples.length);
    const arr = obj.examples;
    arr.forEach((item: any) => {
      TestCodec_encoder_fn(encoder, item);
    });
  }
  return encoder;
}
function TestCodec_encoder_fn(encoder: Encoder, obj: TestCodec): Encoder {
  encoder.int(obj.foo);
  encoder.int(obj.bar);
  encoder.string(obj.name);
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
export { ExampleArray_encoder_fn as moduleEncoder };
