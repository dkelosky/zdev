import Mock = jest.Mock;
jest.mock("../../src/utils");

import { isMounted } from "../../src/actions/mount";
import { runCmd } from "../../src/utils";

describe("mount tests", () => {

    describe("isMounted tests", () => {

        it("should return false if not mounted", async () => {

            const fn = (runCmd as any) as Mock<ReturnType<typeof runCmd>, Parameters<typeof runCmd>>;
            fn.mockImplementation(async (cmd, rfj) => {

                const resp =
                {
                    "success": true,
                    "exitCode": 0,
                    "message": "",
                    "stdout": "\r\n$ df /tmp/kelda16/make2\r\nMounted on     Filesystem                Avail/Total    Files      Status    \r\n/SYSTEM/tmp    (OMVSSYS.CA11.TMP.ZFS)    23357118/23430400 4294967101 Available\r\n\n",
                    "stderr": "",
                    "data": {}
                };
                return JSON.stringify(resp);

            });

            const isM = await isMounted("IBMUSER.ZFS", "/tmp/ibmuser/fake");
            expect(isM).toBe(false);

        });

        it("should return true if mounted", async () => {

            const fn = (runCmd as any) as Mock<ReturnType<typeof runCmd>, Parameters<typeof runCmd>>;
            fn.mockImplementation(async (cmd, rfj) => {

                const resp =
                {
                    "success": true,
                    "exitCode": 0,
                    "message": "",
                    "stdout": "\r\n$ df /tmp/ibmuser/fake\r\nMounted on     Filesystem                Avail/Total    Files      Status    \r\n/SYSTEM/tmp/ibmuser/fake (IBMUSER.ZFS) 9806/14400     4294967272 Available\r\n\n",
                    "stderr": "",
                    "data": {}
                };
                return JSON.stringify(resp);

            });

            const isM = await isMounted("IBMUSER.ZFS", "/tmp/ibmuser/fake");
            expect(isM).toBe(true);

        });

    });

});
