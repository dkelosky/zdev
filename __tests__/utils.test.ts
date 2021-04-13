import Mock = jest.Mock;
jest.mock("fs");

import { getDirs, getListings } from "../src/utils";
import { stat, readdir, Stats } from "fs";

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

    describe("getDirs tests", () => {

        it("should get a list of dirs from a starting dir location recursively", async () => {

            let depth = 3; // number of /dir in path

            // const rd = (readdir as any) as Mock<ReturnType<typeof readdir>, Parameters<typeof readdir>>;
            const rd = (readdir as any) as Mock<ReturnType<typeof readdir>, any>;
            rd.mockImplementation((path, cb) => {
                cb(null, ["file1", "file2", "dir"]);
                depth--;
            });

            const st = (stat as any) as Mock<ReturnType<typeof stat>, any>;
            // const st = (stat as any) as Mock<ReturnType<typeof stat>, Parameters<typeof stat>>;
            st.mockImplementation((path: string, cb) => {

                const sts: Stats = {
                    isDirectory: () => {
                        if (path.indexOf("dir") > -1 && depth > -1 && path.indexOf("file") === -1) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                } as any;

                cb(null, sts);

            });

            const dirs = await getDirs(`some/location`);
            expect(dirs).toMatchSnapshot();
        });


    });

});