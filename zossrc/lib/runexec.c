#include "runexec.h"
#include "wto.h"
#include <stdlib.h>
#include <stdio.h>
#include "load.h"

#pragma prolog(RUNEXE, "MYPROLOG")
// #pragma prolog(RUNEXE, "&CCN_MAIN SETB 1 \n MYPROLOG")
#pragma epilog(RUNEXE, "MYEPILOG")
// #pragma epilog(RUNEXE, "&CCN_MAIN SETB 1 \n MYEPILOG")

typedef int (*BR14)();

int MTLMAIN() ATTRIBUTE(amode64);
typedef int (*SOME_FUNC)() ATTRIBUTE(amode64); // TODO(Kelosky): handle other amodes

int RUNEXE(char *msg)
{
    WTO_BUF buf = {0};

    buf.len = sprintf(buf.msg, "[Debug] got %s", msg);
    wto(&buf);

    if (NULL == msg)
    {
        buf.len = sprintf(buf.msg, "[Error] Missing paramter of module to load");
        wto(&buf);
        return 16;
    }

    SOME_FUNC fn = (SOME_FUNC)loadModule(msg);

    fn = (int)fn & 0x7FFFFFFE;

    if (NULL == fn)
    {
        buf.len = sprintf(buf.msg, "[Error] Could not load program: '%s'", msg);
        wto(&buf);
        return 20;
    }

    int rc = fn();

    deleteModule(msg);
    // void *fn = loadModule("mtlmain ");
    // BR14 fn = (BR14)loadModule("MTLMAIN ");
    // buf.len = sprintf(buf.msg, "%s", msg);
    // wto(&buf);

    // buf.len = sprintf(buf.msg, "fn address is %x", fn);
    // wto(&buf);

    // // if (fn) fn();
    // MTLMAIN();

    // buf.len = sprintf(buf.msg, "back");
    // wto(&buf);

    // __asm(" SVC 199 ");

    // s0c3Abend(3);

    return rc;
}
