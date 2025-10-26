import fs from "fs";
import path from "path";
import {
  CodecBuilder,
  Int,
  Str,
  ArraySerializable,
  OptionalSerializable,
} from "./codecs";

describe("Codecs", () => {
  test("should run tests", async () => {
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
    const arrCodec = new CodecBuilder("ExampleArray").add(
      "examples",
      new ArraySerializable(codec, "ExampleArrayItems")
    );

    const file = await arrCodec.generateFile();
    fs.writeFileSync(path.resolve(__dirname, "./codec.example.ts"), file.code);

    const objectToEncode = {
      examples: [
        {
          name: "TestName",
          foo: 42,
          optionalPresent: 99,
          bar: 42,
          nested: { a: 1, b: 2 },
          arrOfInts: [10, 20, 30],
          arrOfArrOfInts: [
            [1, 2],
            [3, 4, 5],
          ],
          arrOfCodecs: [{ hello: 100 }, { hello: 200 }],
          arrOfOptionals: [1, undefined, 3, undefined, 5],
        },
      ],
    };

    expect(await arrCodec.test(objectToEncode)).toEqual(objectToEncode);
  });
});
