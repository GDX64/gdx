import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';
import fs from 'fs';
import path from 'path';

describe('Codecs', () => {
  test('should run tests', async () => {
    const nested = new CodecBuilder('Nested').add('a', Int).add('b', Int);
    const arrOfInts = new ArraySerializable(Int);
    const arrOfArrOfInts = new ArraySerializable(arrOfInts);
    const helloStruct = new CodecBuilder('Hello').add('hello', Int);
    const arrOfCodecs = new ArraySerializable(helloStruct);
    const codec = new CodecBuilder('Codec')
      .add('foo', Int)
      .add('bar', Int)
      .add('name', Str)
      .add('notPresent', new OptionalSerializable(Int, 'notPresent'))
      .add('optionalPresent', new OptionalSerializable(Int, 'optionalPresent'))
      .add('nested', nested)
      .add('arrOfInts', arrOfInts)
      .add('arrOfArrOfInts', arrOfArrOfInts)
      .add('arrOfCodecs', arrOfCodecs)
      .add(
        'arrOfOptionals',
        new ArraySerializable(new OptionalSerializable(Int, 'arrOfOptionals_item'))
      );

    // const encodeFn = codec.generateDecoderCode();
    const encoderCode = codec.generateEncoderCode();
    fs.writeFileSync(path.resolve(__dirname, './encoder.example.ts'), encoderCode.code);

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

    expect(await codec.test(objectToEncode)).toEqual(objectToEncode);
  });
});

type Field = { name: string; serializable: Serializable };

class CodecBuilder implements Serializable {
  private fields: Field[] = [];

  constructor(private name: string) {}

  static createEncoder() {
    return new Encoder();
  }

  static createDecoder(buffer: number[]) {
    return new Decoder(buffer);
  }

  private typeDeclaration() {
    const lineTypes = this.fields.map((f) => `${f.name}: ${f.serializable.typeName()};`);

    return `
    export type ${this.name} = {
      ${lineTypes.join('\n')}
    }
    `;
  }

  typeName() {
    return this.name;
  }

  children(): Serializable[] {
    return this.fields.map((f) => f.serializable);
  }

  async test(obj: any) {
    const encoded = (await this.createEncoderFunction())(
      CodecBuilder.createEncoder(),
      obj
    );
    return (await this.createDecoderFunction())(
      CodecBuilder.createDecoder(encoded.getBuffer())
    );
  }

  async createEncoderFunction() {
    const transpiledModule = this.generateEncoderCode().transpiled;
    const { moduleEncoder } = await import(
      `data:text/javascript;base64,${Buffer.from(transpiledModule).toString('base64')}`
    );
    return moduleEncoder;
  }

  async createDecoderFunction() {
    const transpiledModule = this.generateDecoderCode().transpiled;
    const { moduleDecoder } = await import(
      `data:text/javascript;base64,${Buffer.from(transpiledModule).toString('base64')}`
    );
    return moduleDecoder;
  }

  add(name: string, serializable: Serializable) {
    this.fields.push({ name, serializable });
    return this;
  }

  generateEncoderCode() {
    const allCodecBuilders = new Set<Serializable>();
    function traverse(serializable: Serializable) {
      if (serializable.topLevelEncoderCode) {
        allCodecBuilders.add(serializable);
      }
      serializable.children().forEach((field) => traverse(field));
    }
    traverse(this);
    const functionDeclarations: string[] = [];
    allCodecBuilders.forEach((cb) => {
      functionDeclarations.push(cb.topLevelEncoderCode!());
    });
    const functionName = `${this.name}_encoder_fn`;
    const code = `
    type Encoder = any;
    ${functionDeclarations.join('\n')}
    export default ${functionName} 
    export { ${functionName} as moduleEncoder };
    `;
    return { code, transpiled: transpileCode(code).outputText };
  }

  topLevelEncoderCode() {
    const lines: string[] = [];
    lines.push(`function ${this.name}_encoder_fn(encoder: Encoder, obj: any): Encoder {`);
    this.fields.map((field) => {
      lines.push(`${field.serializable.encoder(`obj.${field.name}`)};`);
    });
    lines.push(`return encoder;`);
    lines.push(`}`);
    const code = lines.join('\n');
    return code;
  }

  topLevelDecoderCode() {
    const lines: string[] = [];
    lines.push(this.typeDeclaration());
    lines.push(
      `function ${this.name}_decoder_func(decoder: Decoder): ${this.typeName()}{`
    );
    lines.push(`let obj: any = {};`);
    this.fields.map((field) => {
      lines.push(`obj.${field.name} = ${field.serializable.decoder()};`);
    });
    lines.push(`return obj;`);
    lines.push(`}`);

    return lines.join('\n');
  }

  generateDecoderCode() {
    const allCodecBuilders = new Set<Serializable>();
    function traverse(serializable: Serializable) {
      if (serializable.topLevelDecoderCode) {
        allCodecBuilders.add(serializable);
      }
      serializable.children().forEach((field) => traverse(field));
    }
    traverse(this);
    const functionDeclarations: string[] = [];
    allCodecBuilders.forEach((cb) => {
      functionDeclarations.push(cb.topLevelDecoderCode!());
    });
    const code = `
    type Decoder = any;
    ${functionDeclarations.join('\n')}
    export default ${this.name}_decoder_func 
    export { ${this.name}_decoder_func as moduleDecoder };
    `;
    return { code, transpiled: transpileCode(code).outputText };
  }

  encoder(what: string): string {
    const functionName = `${this.name}_encoder_fn`;
    return `${functionName}(encoder, ${what})`;
  }

  decoder(): string {
    const functionName = `${this.name}_decoder_func`;
    return `${functionName}(decoder)`;
  }
}

interface Serializable {
  encoder(what: string): string;
  topLevelDecoderCode?(): string;
  topLevelEncoderCode?(): string;
  decoder(): string;
  children(): Serializable[];
  typeName(): string;
}

class IntSerializable implements Serializable {
  children() {
    return [];
  }

  typeName() {
    return 'number';
  }

  encoder(what: string) {
    return `encoder.int(${what})`;
  }

  decoder() {
    return `decoder.int()`;
  }
}

class ArraySerializable implements Serializable {
  constructor(private itemSerializable: Serializable) {}

  children(): Serializable[] {
    return [this.itemSerializable];
  }

  typeName(): string {
    return `${this.itemSerializable.typeName()}[]`;
  }

  encoder(what: string) {
    return `{
      encoder.int(${what}.length);
      const arr = ${what};
      arr.forEach((item: any)=>{
        ${this.itemSerializable.encoder('item')};
      })
    }`;
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
  children(): Serializable[] {
    return [];
  }
  typeName(): string {
    return 'string';
  }
  encoder(what: string) {
    return `{
      const str = ${what}; 
      encoder.int(str.length);
      for(let i=0; i<str.length; i++){
        encoder.int(str.charCodeAt(i));
      }
    }`;
  }

  decoder(): string {
    return 'decoder.string()';
  }
}

class OptionalSerializable implements Serializable {
  constructor(private itemSerializable: Serializable, private name: string) {}
  children(): Serializable[] {
    return [this.itemSerializable];
  }

  typeName(): string {
    return `${this.itemSerializable.typeName()} | undefined`;
  }

  topLevelDecoderCode(): string {
    const itemName = `${this.name}_optional_item_decoder_func`;
    return `function ${itemName}(decoder: Decoder): ${this.typeName()}{
      const hasValue = decoder.int() === 1;
      if(hasValue){
        return ${this.itemSerializable.decoder()};
      }
      return undefined;
  }
    `;
  }

  encoder(what: string) {
    return `{
      const hasValue = ${what} != null;
      encoder.int(hasValue ? 1 : 0);
      if(hasValue){
        ${this.itemSerializable.encoder(what)};
      }
    };
    `;
  }

  decoder(): string {
    const itemName = `${this.name}_optional_item_decoder_func`;
    return `${itemName}(decoder)`;
  }
}

const Str = new StringSerializable();

const Int = new IntSerializable();

class Encoder {
  private buffer: number[] = [];

  int(value: number) {
    this.buffer.push(value);
  }

  string(value: string) {
    this.int(value.length);
    for (let i = 0; i < value.length; i++) {
      this.int(value.charCodeAt(i));
    }
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

  string() {
    const length = this.int();
    let str = '';
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(this.int());
    }
    return str;
  }
}

function transpileCode(code: string) {
  return transpileModule(code, {
    compilerOptions: {
      target: ScriptTarget.ESNext,
      module: ModuleKind.ESNext,
    },
  });
}
