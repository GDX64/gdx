type Encoder = any;
function Codec_encoder_fn(encoder: Encoder, obj: any): Encoder {
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
function Nested_encoder_fn(encoder: Encoder, obj: any): Encoder {
  encoder.int(obj.a);
  encoder.int(obj.b);
  return encoder;
}
function Hello_encoder_fn(encoder: Encoder, obj: any): Encoder {
  encoder.int(obj.hello);
  return encoder;
}
export default Codec_encoder_fn;
export { Codec_encoder_fn as moduleEncoder };
