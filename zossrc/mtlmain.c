#include "wto.h"
#include "stdio.h"
#include "stdlib.h"
#include "ams.h"

// #pragma prolog(MTLMAIN, "MYPROLOG")
// #pragma prolog(MTLMAIN, "&CCN_MAIN SETB 1")
// #pragma epilog(MTLMAIN, "MYEPILOG")
// #pragma epilog(MTLMAIN, "&CCN_MAIN SETB 1")

// test
int main()
{
    unsigned int resp = 0;

    WTO_BUF buf = {0};
    buf.len = sprintf(buf.msg, "hello world");
    wto(&buf);

    int rc = 0;
    int rsn = 0;

    // IO_CTRL *snapIoc = openOutputAssert("SNAP", 125, 1632, dcbrecv + dcbrecbr + dcbrecca);
    // IO_CTRL *sysprintIoc = openOutputAssert("SYSPRINT", 132, 132, dcbrecf + dcbrecbr);

    return 0;
}