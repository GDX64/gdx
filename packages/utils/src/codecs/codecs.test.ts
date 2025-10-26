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
    const arrOfInts = new ArraySerializable(Int);
    const arrOfArrOfInts = new ArraySerializable(arrOfInts);
    const helloStruct = new CodecBuilder("Hello").add("hello", Int);
    const arrOfCodecs = new ArraySerializable(helloStruct);
    const codec = new CodecBuilder("Codec")
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
          new OptionalSerializable(Int, "arrOfOptionals_item")
        )
      );

    const encoderCode = await codec.generateEncoderCode();
    fs.writeFileSync(
      path.resolve(__dirname, "./encoder.example.ts"),
      encoderCode.code
    );
    const decoderCode = await codec.generateDecoderCode();
    fs.writeFileSync(
      path.resolve(__dirname, "./decoder.example.ts"),
      decoderCode.code
    );

    const objectToEncode = {
      foo: 42,
      optionalPresent: 99,
      bar: 42,
      name: "TestName",
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
