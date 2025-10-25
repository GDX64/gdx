describe('Codecs', () => {
  test('should run tests', () => {
    const codec = new CodecBuilder().addInt('foo').addInt('bar');

    const arrayBuilder = new CodecBuilder().addInt('item1').addInt('item2');
    const flatArrayBuilder = new CodecBuilder().addInt(null);

    const otherCodec = new CodecBuilder()
      .addInt('baz')
      .addCodec('nested', codec)
      .addArray('arr', arrayBuilder)
      .addArray('flatArr', flatArrayBuilder);
    console.log(otherCodec.generateDecoder());
    console.log(otherCodec.generateEncoder());

    const encoderFn = otherCodec.createEncoderFunction();
    const objectToEncode = {
      baz: 42,
      nested: { foo: 1, bar: 2 },
      arr: [{ item1: 1, item2: 2 }],
      flatArr: [7, 8, 9],
    };
    const encoder = CodecBuilder.createEncoder();
    encoderFn(encoder, objectToEncode);
    const buffer = encoder.getBuffer();
    console.log('Encoded Buffer:', buffer);
    const decoderFn = otherCodec.createDecoderFunction();
    const decoder = CodecBuilder.createDecoder(buffer);
    const decodedObject = decoderFn(decoder);
    expect(decodedObject).toEqual(objectToEncode);
  });
});

enum Tags {
  INT,
  CODEC,
  ARRAY,
}

type Field =
  | {
      type: Tags.INT;
      name: string | null;
    }
  | {
      type: Tags.CODEC;
      name: string;
      codec: CodecBuilder;
    }
  | {
      type: Tags.ARRAY;
      name: string;
      codec: CodecBuilder;
    };

class CodecBuilder {
  private fields: Field[] = [];

  static createEncoder() {
    return new Encoder();
  }

  static createDecoder(buffer: number[]) {
    return new Decoder(buffer);
  }

  createEncoderFunction() {
    return eval(this.generateEncoder());
  }

  createDecoderFunction() {
    return eval(this.generateDecoder());
  }

  addInt(name: string | null) {
    this.fields.push({ type: Tags.INT, name });
    return this;
  }

  addArray(name: string, codec: CodecBuilder) {
    this.fields.push({ type: Tags.ARRAY, name, codec });
    return this;
  }

  addCodec(name: string, codec: CodecBuilder) {
    this.fields.push({ type: Tags.CODEC, name, codec });
    return this;
  }

  generateEncoder() {
    const lines: string[] = [];
    lines.push(`(encoder, obj)=>{`);
    this.fields.map((field) => {
      if (field.type === Tags.INT) {
        if (field.name == null) {
          lines.push(`encoder.int(obj);`);
        } else {
          lines.push(`encoder.int(obj.${field.name});`);
        }
      } else if (field.type === Tags.CODEC) {
        lines.push(`(${field.codec.generateEncoder()})(encoder, obj.${field.name});`);
      } else if (field.type === Tags.ARRAY) {
        //encode the array length first
        lines.push(`encoder.int(obj.${field.name}.length);`);
        lines.push(`const itemEncoder_${field.name} = ${field.codec.generateEncoder()};`);
        lines.push(`obj.${field.name}.forEach((item)=>{`);
        lines.push(`itemEncoder_${field.name}(encoder, item);`);
        lines.push(`});`);
      }
    });
    lines.push(`}`);
    return lines.join('\n');
  }

  generateDecoder() {
    const lines: string[] = [];
    lines.push(`(decoder)=>{`);
    lines.push(`let obj = {};`);
    this.fields.map((field) => {
      if (field.type === Tags.INT) {
        if (field.name == null) {
          lines.push(`obj = decoder.int();`);
        } else {
          lines.push(`obj.${field.name} = decoder.int();`);
        }
      } else if (field.type === Tags.CODEC) {
        lines.push(`obj.${field.name} = (${field.codec.generateDecoder()})(decoder);`);
      } else if (field.type === Tags.ARRAY) {
        lines.push(`obj.${field.name} = [];`);
        lines.push(`const itemDecoder_${field.name} = ${field.codec.generateDecoder()};`);
        lines.push(`const length_${field.name} = decoder.int();`);
        lines.push(`for(let i=0; i<length_${field.name}; i++){`);
        lines.push(`obj.${field.name}.push(itemDecoder_${field.name}(decoder));`);
        lines.push(`}`);
      }
    });
    lines.push(`return obj;`);
    lines.push(`}`);

    return lines.join('\n');
  }
}

interface Serializable {
  encoder(): string;
  decoder(): string;
}

class IntSerializable implements Serializable {
  encoder() {
    return `encoder.int(value);`;
  }

  decoder() {
    return `decoder.int();`;
  }
}

class Encoder {
  private buffer: number[] = [];

  int(value: number) {
    this.buffer.push(value);
  }

  getBuffer() {
    return this.buffer;
  }
}

class Decoder {
  constructor(private buffer: number[]) {}
  int() {
    return this.buffer.shift()!;
  }
}
