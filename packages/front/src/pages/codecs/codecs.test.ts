describe('Codecs', () => {
  test('should run tests', () => {
    const nested = new CodecBuilder().add('a', Int).add('b', Int);
    const arrOfInts = new ArraySerializable(Int);
    const arrOfArrOfInts = new ArraySerializable(arrOfInts);
    const helloStruct = new CodecBuilder().add('hello', Int);
    const arrOfCodecs = new ArraySerializable(helloStruct);
    const codec = new CodecBuilder()
      .add('foo', Int)
      .add('bar', Int)
      .add('name', Str)
      .add('notPresent', new OptionalSerializable(Int))
      .add('optionalPresent', new OptionalSerializable(Int))
      .add('nested', nested)
      .add('arrOfInts', arrOfInts)
      .add('arrOfArrOfInts', arrOfArrOfInts)
      .add('arrOfCodecs', arrOfCodecs)
      .add('arrOfOptionals', new ArraySerializable(new OptionalSerializable(Int)));

    const encoderFn = codec.createEncoderFunction();
    const objectToEncode = {
      foo: 42,
      optionalPresent: 99,
      bar: 42,
      name: 'TestName',
      nested: { a: 1, b: 2 },
      arrOfInts: [10, 20, 30],
      arrOfArrOfInts: [
        [1, 2],
        [3, 4, 5],
      ],
      arrOfCodecs: [{ hello: 100 }, { hello: 200 }],
      arrOfOptionals: [1, undefined, 3, undefined, 5],
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

class StringSerializable implements Serializable {
  encoder(what: string) {
    return `(()=>{
      const str = ${what}; 
      encoder.int(str.length);
      for(let i=0; i<str.length; i++){
        encoder.int(str.charCodeAt(i));
      }
    })()`;
  }

  decoder(): string {
    return `((decoder)=>{
    const length = decoder.int();
    let str = '';
    for(let i=0; i<length; i++){
      str += String.fromCharCode(decoder.int());
    }
    return str;
  })(decoder)`;
  }
}

class OptionalSerializable implements Serializable {
  constructor(private itemSerializable: Serializable) {}
  encoder(what: string) {
    return `(()=>{
      const hasValue = ${what} != null;
      encoder.int(hasValue ? 1 : 0);
      if(hasValue){
        ${this.itemSerializable.encoder(what)};
      }
    })()
    `;
  }
  decoder(): string {
    return `(()=>{
      const hasValue = decoder.int() === 1;
      if(hasValue){
        return ${this.itemSerializable.decoder()};
      }
      return undefined;
  })()
    `;
  }
}

const Str = new StringSerializable();

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
