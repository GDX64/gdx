export function moduleEncoder(encoder, obj) {
    encoder.int(obj.foo);
    encoder.int(obj.bar);
    {
        const str = obj.name;
        encoder.int(str.length);
        for (let i = 0; i < str.length; i++) {
            encoder.int(str.charCodeAt(i));
        }
    }
    ;
    {
        const hasValue = obj.notPresent != null;
        encoder.int(hasValue ? 1 : 0);
        if (hasValue) {
            encoder.int(obj.notPresent);
        }
    }
    ;
    ;
    {
        const hasValue = obj.optionalPresent != null;
        encoder.int(hasValue ? 1 : 0);
        if (hasValue) {
            encoder.int(obj.optionalPresent);
        }
    }
    ;
    ;
    ();
    export function moduleEncoder(encoder, obj) {
        encoder.int(obj.a);
        encoder.int(obj.b);
        return encoder;
    }
    (encoder, obj.nested);
    {
        encoder.int(obj.arrOfInts.length);
        const arr = obj.arrOfInts;
        arr.forEach((item) => {
            encoder.int(item);
        });
    }
    ;
    {
        encoder.int(obj.arrOfArrOfInts.length);
        const arr = obj.arrOfArrOfInts;
        arr.forEach((item) => {
            {
                encoder.int(item.length);
                const arr = item;
                arr.forEach((item) => {
                    encoder.int(item);
                });
            }
            ;
        });
    }
    ;
    {
        encoder.int(obj.arrOfCodecs.length);
        const arr = obj.arrOfCodecs;
        arr.forEach((item) => {
            ();
            export function moduleEncoder(encoder, obj) {
                encoder.int(obj.hello);
                return encoder;
            }
        })(encoder, item);
    }
}
;
{
    encoder.int(obj.arrOfOptionals.length);
    const arr = obj.arrOfOptionals;
    arr.forEach((item) => {
        {
            const hasValue = item != null;
            encoder.int(hasValue ? 1 : 0);
            if (hasValue) {
                encoder.int(item);
            }
        }
        ;
        ;
    });
}
;
return encoder;