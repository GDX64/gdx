import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import prettier from "prettier";

type Field = { name: string; serializable: Serializable };
type EncoderFn = (encoder: Encoder, obj: any) => Encoder;
type DecoderFn = (decoder: Decoder) => any;

export class CodecBuilder implements Serializable {
  private fields: Field[] = [];

  constructor(private name: string) {}

  static createEncoder(): Encoder {
    return new Encoder();
  }

  static createDecoder(buffer: number[]): Decoder {
    return new Decoder(buffer);
  }

  private typeDeclaration() {
    const lineTypes = this.fields.map(
      (f) => `${f.name}: ${f.serializable.typeName()};`
    );

    return `
    export type ${this.name} = {
      ${lineTypes.join("\n")}
    }
    `;
  }

  typeName(): string {
    return this.name;
  }

  children(): Serializable[] {
    return this.fields.map((f) => f.serializable);
  }

  async test<T>(obj: T): Promise<T> {
    const encoded = (await this.createEncoderFunction())(
      CodecBuilder.createEncoder(),
      obj
    );
    return (await this.createDecoderFunction())(
      CodecBuilder.createDecoder(encoded.getBuffer())
    );
  }

  async createEncoderFunction(): Promise<EncoderFn> {
    const { transpiled } = await this.generateEncoderCode();
    const { moduleEncoder } = await import(
      `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`
    );
    return moduleEncoder;
  }

  async createDecoderFunction(): Promise<DecoderFn> {
    const { transpiled } = await this.generateDecoderCode();
    const { moduleDecoder } = await import(
      `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`
    );
    return moduleDecoder;
  }

  add(name: string, serializable: Serializable): this {
    this.fields.push({ name, serializable });
    return this;
  }

  async generateEncoderCode(): Promise<{ code: string; transpiled: string }> {
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
    let code = `
    type Encoder = any;
    ${functionDeclarations.join("\n")}
    export default ${functionName} 
    export { ${functionName} as moduleEncoder };
    `;
    code = await prettier.format(code, { parser: "typescript" });
    return { code, transpiled: transpileCode(code).outputText };
  }

  topLevelEncoderCode(): string {
    const lines: string[] = [];
    lines.push(
      `function ${this.name}_encoder_fn(encoder: Encoder, obj: any): Encoder {`
    );
    this.fields.map((field) => {
      lines.push(`${field.serializable.encoder(`obj.${field.name}`)};`);
    });
    lines.push(`return encoder;`);
    lines.push(`}`);
    const code = lines.join("\n");
    return code;
  }

  topLevelDecoderCode(): string {
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

    return lines.join("\n");
  }

  async generateDecoderCode(): Promise<{ code: string; transpiled: string }> {
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
    let code = `
    type Decoder = any;
    ${functionDeclarations.join("\n")}
    export default ${this.name}_decoder_func 
    export { ${this.name}_decoder_func as moduleDecoder };
    `;
    code = await prettier.format(code, { parser: "typescript" });
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

export class IntSerializable implements Serializable {
  children(): Serializable[] {
    return [];
  }

  typeName() {
    return "number";
  }

  encoder(what: string) {
    return `encoder.int(${what})`;
  }

  decoder() {
    return `decoder.int()`;
  }
}

export class ArraySerializable implements Serializable {
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
        ${this.itemSerializable.encoder("item")};
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
    return "string";
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
    return "decoder.string()";
  }
}

export class OptionalSerializable implements Serializable {
  constructor(
    private itemSerializable: Serializable,
    private name: string
  ) {}
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

export const Str: StringSerializable = new StringSerializable();

export const Int: IntSerializable = new IntSerializable();

export class Encoder {
  private buffer: number[] = [];

  int(value: number): void {
    this.buffer.push(value);
  }

  string(value: string): void {
    this.int(value.length);
    for (let i = 0; i < value.length; i++) {
      this.int(value.charCodeAt(i));
    }
  }

  getBuffer(): number[] {
    return this.buffer;
  }
}

export class Decoder {
  constructor(private buffer: number[]) {}

  int(): number {
    return this.buffer.shift()!;
  }

  string(): string {
    const length = this.int();
    let str = "";
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
