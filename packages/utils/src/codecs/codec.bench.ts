import { describe, bench } from "vitest";
import { CodecBuilder } from "./codecs";
import { moduleDecoder, moduleEncoder } from "./codec.example";

describe("Codecs Benchmark", async () => {
  const examples = generateExamples(2_000);
  bench("ArraySerializable encode/decode", () => {
    const encoder = CodecBuilder.createEncoder();
    moduleEncoder(encoder, examples);
    const buffer = encoder.getBuffer();
    const decoder = CodecBuilder.createDecoder(buffer);
    moduleDecoder(decoder);
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
    notPresent: undefined,
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
