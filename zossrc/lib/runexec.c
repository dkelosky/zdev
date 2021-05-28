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


int RUNEXE(char *msg)
{
    WTO_BUF buf = {0};

    // void *fn = loadModule("MTLMAIN ");
    // void *fn = loadModule("mtlmain ");
    // BR14 fn = (BR14)loadModule("MTLMAIN ");
    buf.len = sprintf(buf.msg, "%s", msg);
    wto(&buf);

    // if (fn) fn();
    MTLMAIN();

    buf.len = sprintf(buf.msg, "back");
    wto(&buf);

    // __asm(" SVC 199 ");

    // s0c3Abend(3);

    return 3;
}
