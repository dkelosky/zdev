#include "wto.h"
#include "stdio.h"
#include "stdlib.h"
#include "ams.h"
#include "hash.h"

// #pragma prolog(MTLMAIN, "MYPROLOG")
// #pragma prolog(MTLMAIN, "&CCN_MAIN SETB 1")
// #pragma epilog(MTLMAIN, "MYEPILOG")
// #pragma epilog(MTLMAIN, "&CCN_MAIN SETB 1")


// test
int main()
{
    unsigned int resp = 0;

    char *name = "tucker.jason.rulezd";
    unsigned char len = strlen(name);

    // __asm(" SVC 199 ");
    HASHED shortInstance = {0};
    hash(name, &shortInstance);

    WTO_BUF buf = {0};
    buf.len = sprintf(buf.msg, "input string '%s' hashed is x'%.16s'\n", name, shortInstance.value);
    wto(&buf);

    int rc = 0;
    int rsn = 0;

    // IO_CTRL *snapIoc = openOutputAssert("SNAP", 125, 1632, dcbrecv + dcbrecbr + dcbrecca);
    // IO_CTRL *sysprintIoc = openOutputAssert("SYSPRINT", 132, 132, dcbrecf + dcbrecbr);

    return 0;
}