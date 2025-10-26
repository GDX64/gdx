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

  typeDeclaration() {
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
    const { moduleEncoder, moduleDecoder } = await this.createModule();
    const encoder = CodecBuilder.createEncoder();
    moduleEncoder(encoder, obj);
    const buffer = encoder.getBuffer();
    const decoder = CodecBuilder.createDecoder(buffer);
    const decoded = moduleDecoder(decoder);
    return decoded;
  }

  async createModule(): Promise<{
    moduleEncoder: EncoderFn;
    moduleDecoder: DecoderFn;
  }> {
    const { code } = await this.generateFile();
    const transpiled = transpileCode(code).outputText;
    const { moduleEncoder, moduleDecoder } = await import(
      `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`
    );
    return { moduleEncoder, moduleDecoder };
  }

  async generateFile(): Promise<{ code: string }> {
    const { code: encoderCode } = this.generateEncoderCode();
    const { code: decoderCode } = this.generateDecoderCode();
    const codeUnformatted = [decoderCode, encoderCode].join("\n");
    const code = await prettier.format(codeUnformatted, {
      parser: "typescript",
    });
    return { code };
  }

  add(name: string, serializable: Serializable): this {
    this.fields.push({ name, serializable });
    return this;
  }

  private generateEncoderCode(): { code: string } {
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
    ${functionDeclarations.join("\n")}
    export { ${functionName} as moduleEncoder };
    `;
    return { code };
  }

  topLevelEncoderCode(): string {
    const lines: string[] = [];
    lines.push(
      `function ${this.name}_encoder_fn(encoder: Encoder, obj: ${this.typeName()}): Encoder {`
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
    lines.push(
      `function ${this.name}_decoder_func(decoder: Decoder): ${this.typeName()}{`
    );
    lines.push(`const obj = {} as ${this.typeName()};`);
    this.fields.map((field) => {
      lines.push(`obj.${field.name} = ${field.serializable.decoder()};`);
    });
    lines.push(`return obj;`);
    lines.push(`}`);

    return lines.join("\n");
  }

  private generateDecoderCode(): { code: string } {
    const allCodecBuilders = new Set<Serializable>();
    function traverse(serializable: Serializable) {
      allCodecBuilders.add(serializable);
      serializable.children().forEach((field) => traverse(field));
    }
    traverse(this);
    const functionDeclarations: string[] = [];
    allCodecBuilders.forEach((cb) => {
      if (cb.typeDeclaration) {
        functionDeclarations.push(cb.typeDeclaration());
      }
    });
    allCodecBuilders.forEach((cb) => {
      if (cb.topLevelDecoderCode) {
        functionDeclarations.push(cb.topLevelDecoderCode());
      }
    });
    let code = `
    type Decoder = any;
    type Encoder = any;
    ${functionDeclarations.join("\n")}
    export { ${this.name}_decoder_func as moduleDecoder };
    `;
    return { code };
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
  typeDeclaration?(): string;
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
  constructor(
    private itemSerializable: Serializable,
    private name: string
  ) {}

  children(): Serializable[] {
    return [this.itemSerializable];
  }

  typeName(): string {
    return `Array<${this.itemSerializable.typeName()}>`;
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

  topLevelDecoderCode(): string {
    const functionName = `${this.name}_array_item_decoder_func`;
    return `
    function ${functionName}(decoder: Decoder): ${this.typeName()}{
    const arr = [];
    const length = decoder.int();
    for(let i=0; i<length; i++){
      arr.push(${this.itemSerializable.decoder()});
    }
    return arr;
  }`;
  }

  decoder(): string {
    return `${this.name}_array_item_decoder_func(decoder)`;
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
  private index = 0;
  constructor(private buffer: number[]) {}

  int(): number {
    const value = this.buffer[this.index];
    this.index++;
    return value;
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
