import { describe, bench } from "vitest";
import { CodecBuilder } from "./codecs";
import { moduleDecoder, moduleEncoder } from "./codec.example";

describe("Codecs Benchmark", async () => {
  const examples = generateExamples(1_000);
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

const randInt = (max = 2 ** 30) => Math.floor(Math.random() * max);
function generateExample() {
  return {
    foo: randInt(),
    optionalPresent: randInt(),
    notPresent: undefined,
    bar: randInt(),
    name: "TestName",
    nested: { a: randInt(), b: randInt() },
    arrOfInts: Array.from({ length: randInt(100) }, () => randInt()),
    arrOfArrOfInts: bigMatrix(),
    arrOfCodecs: [{ hello: randInt() }, { hello: randInt() }],
    arrOfOptionals: [randInt(), undefined, randInt(), undefined, randInt()],
  };
}

function bigMatrix() {
  const matrix = [];
  for (let i = 0; i < 100; i++) {
    matrix.push(Array.from({ length: randInt(10) }, () => randInt()));
  }
  return matrix;
}
