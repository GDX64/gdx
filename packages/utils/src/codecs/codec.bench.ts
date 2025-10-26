import { describe, bench } from "vitest";
import {
  CodecBuilder,
  Int,
  Str,
  ArraySerializable,
  OptionalSerializable,
} from "./codecs";

describe("Codecs Benchmark", async () => {
  const nested = new CodecBuilder("Nested").add("a", Int).add("b", Int);
  const arrOfInts = new ArraySerializable(Int, "IntArray");
  const arrOfArrOfInts = new ArraySerializable(arrOfInts, "ArrOfIntArray");
  const helloStruct = new CodecBuilder("Hello").add("hello", Int);
  const arrOfCodecs = new ArraySerializable(helloStruct, "HelloArray");
  const codec = new CodecBuilder("TestCodec")
    .add("foo", Int)
    .add("bar", Int)
    .add("name", Str)
    .add("notPresent", new OptionalSerializable(Int, "notPresent"))
    .add("optionalPresent", new OptionalSerializable(Int, "optionalPresent"))
    .add("nested", nested)
    .add("arrOfInts", arrOfInts)
    .add("arrOfArrOfInts", arrOfArrOfInts)
    .add("arrOfCodecs", arrOfCodecs)
    .add(
      "arrOfOptionals",
      new ArraySerializable(
        new OptionalSerializable(Int, "arrOfOptionals_item"),
        "ArrOfOptionals"
      )
    );

  const examples = generateExamples(1_000);
  const arrCodec = new CodecBuilder("ExampleArray").add(
    "examples",
    new ArraySerializable(codec, "ExampleArrayItems")
  );
  const { moduleDecoder, moduleEncoder } = await arrCodec.createModule();
  bench("ArraySerializable encode/decode", () => {
    const encoder = CodecBuilder.createEncoder();
    moduleEncoder(encoder, examples);
    const decoder = CodecBuilder.createDecoder(encoder.getBuffer());
    const decoded = moduleDecoder(decoder);
    return decoded;
  });
  bench("json", () => {
    const json = JSON.stringify(examples);
    const parsed = JSON.parse(json);
    return parsed;
  });
});

function generateExamples(n: number) {
  return {
    examples: Array.from({ length: n }, () => generateExample()),
  };
}

function generateExample() {
  const randInt = () => Math.floor(Math.random() * 1000);
  return {
    foo: randInt(),
    optionalPresent: randInt(),
    bar: randInt(),
    name: "TestName",
    nested: { a: randInt(), b: randInt() },
    arrOfInts: [randInt(), randInt(), randInt()],
    arrOfArrOfInts: [
      [randInt(), randInt()],
      [randInt(), randInt(), randInt()],
    ],
    arrOfCodecs: [{ hello: randInt() }, { hello: randInt() }],
    arrOfOptionals: [randInt(), undefined, randInt(), undefined, randInt()],
  };
}
