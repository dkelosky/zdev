import { getListings } from "../src/utils";

import Mock = jest.Mock;
jest.mock("fs");
import { stat } from "fs";

describe("utils tests", () => {

    describe("getListings tests", () => {
        it("should parse metal, asm, and binder listings", async () => {

            const text =
            `xlc -S -W "c,metal, langlvl(extended), sscom, nolongname, inline, genasm, inlrpt, csect, nose, lp64, list, warn64, optimize(2), list, showinc, showmacro, source, aggregate" -qlist=mtlmain.mtl.lst -I/usr/include/metal -o mtlmain.s mtlmain.c\n` +
            `WARNING CCN3296 ./wto.h:15    #include file "ihaecb.h" not found.\n` +
            `as  -a=mtlmain.asm.lst -o mtlmain.o mtlmain.s\n` +
            ` Assembler Done No Statements Flagged\n` +
            `ld -bRMODE=ANY -V -eMAIN -o mtlmain mtlmain.o > mtlmain.bind.lst\n` +
            ` IEW2278I B352 INVOCATION PARAMETERS -\n` +
            `          TERM=YES,PRINT=NO,MSGLEVEL=4,STORENX=NEVER,RMODE=ANY,LIST=NOIMP,XREF=\n` +
            `          YES,MAP=YES,PRINT=YES,MSGLEVEL=0\n` +
            ` IEW2008I 0F03 PROCESSING COMPLETED.  RETURN CODE =  0.\n`;

            const listings = await getListings(text);
            expect(listings).toMatchSnapshot();
        });
    });

    // describe("createCacheDirs tests", () => {

    //     const fn = (stat as any) as Mock<ReturnType<typeof stat>, Parameters<typeof stat>>;
    //     fn.mockImplementation((path) => {
    //         return {
    //             is
    //         }
    //     });

    // });

});