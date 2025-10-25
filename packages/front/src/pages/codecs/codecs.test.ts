describe('Codecs', () => {
  test('should run tests', () => {
    const nested = new CodecBuilder().add('a', Int).add('b', Int);
    const arrOfInts = new ArraySerializable(Int);
    const arrOfArrOfInts = new ArraySerializable(arrOfInts);
    const arrOfCodecs = new ArraySerializable(new CodecBuilder().add('hello', Int));
    const codec = new CodecBuilder()
      .add('foo', Int)
      .add('bar', Int)
      .add('nested', nested)
      .add('arrOfInts', arrOfInts)
      .add('arrOfArrOfInts', arrOfArrOfInts)
      .add('arrOfCodecs', arrOfCodecs);

    console.log(codec.generateEncoderCode());
    // console.log(codec.generateDecoderCode());

    const encoderFn = codec.createEncoderFunction();
    const objectToEncode = {
      foo: 42,
      bar: 42,
      nested: { a: 1, b: 2 },
      arrOfInts: [10, 20, 30],
      arrOfArrOfInts: [
        [1, 2],
        [3, 4, 5],
      ],
      arrOfCodecs: [{ hello: 100 }, { hello: 200 }],
    };
    const encoder = CodecBuilder.createEncoder();
    encoderFn(encoder, objectToEncode);
    const buffer = encoder.getBuffer();
    console.log('Encoded Buffer:', buffer);
    const decoderFn = codec.createDecoderFunction();
    const decoder = CodecBuilder.createDecoder(buffer);
    const decodedObject = decoderFn(decoder);
    expect(decodedObject).toEqual(objectToEncode);
  });
});

type Field = { name: string; serializable: Serializable };

class CodecBuilder implements Serializable {
  private fields: Field[] = [];

  static createEncoder() {
    return new Encoder();
  }

  static createDecoder(buffer: number[]) {
    return new Decoder(buffer);
  }

  createEncoderFunction() {
    return eval(this.generateEncoderCode());
  }

  createDecoderFunction() {
    return eval(this.generateDecoderCode());
  }

  add(name: string, serializable: Serializable) {
    this.fields.push({ name, serializable });
    return this;
  }

  generateEncoderCode() {
    const lines: string[] = [];
    lines.push(`(encoder, obj)=>{`);
    this.fields.map((field) => {
      lines.push(`${field.serializable.encoder(`obj.${field.name}`)};`);
    });
    lines.push(`}`);
    return lines.join('\n');
  }

  generateDecoderCode() {
    const lines: string[] = [];
    lines.push(`(decoder)=>{`);
    lines.push(`let obj = {};`);
    this.fields.map((field) => {
      lines.push(`obj.${field.name} = ${field.serializable.decoder()};`);
    });
    lines.push(`return obj;`);
    lines.push(`}`);

    return lines.join('\n');
  }

  encoder(what: string): string {
    const encoderFunction = this.generateEncoderCode();
    return `(${encoderFunction})(encoder, ${what})`;
  }

  decoder(): string {
    const decoderFunction = this.generateDecoderCode();
    return `(${decoderFunction})(decoder)`;
  }
}

interface Serializable {
  encoder(what: string): string;
  decoder(): string;
}

class IntSerializable implements Serializable {
  encoder(what: string) {
    return `encoder.int(${what})`;
  }

  decoder() {
    return `decoder.int()`;
  }
}

class ArraySerializable implements Serializable {
  constructor(private itemSerializable: Serializable) {}

  encoder(what: string) {
    return `(()=>{encoder.int(${what}.length);
      const arr = ${what};
      arr.forEach((item)=>{
        ${this.itemSerializable.encoder('item')};
      })
    })()`;
  }

  decoder(): string {
    return `((decoder)=>{
    const arr = [];
    const length = decoder.int();
    for(let i=0; i<length; i++){
      arr.push(${this.itemSerializable.decoder()});
    }
    return arr;
  })(decoder)`;
  }
}

const Int = new IntSerializable();

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
