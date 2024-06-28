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

// TODO(Kelosky): shared type for programs run via `./lib/run`
typedef int (*ROUTINE64)(IN_DATA *) ATTRIBUTE(amode64);
typedef int (*ROUTINE31)(IN_DATA *) ATTRIBUTE(amode31);

int RUNEXE(char *program, char *parameters)
{
    WTO_BUF buf = {0};

    ROUTINE64 fn64 = NULL;
    ROUTINE31 fn31 = NULL;

    IN_DATA inData = {0};
    inData.length = sprintf(inData.parms, "%s", parameters);

    int rc = 0;

    buf.len = sprintf(buf.msg, "[DEBUG] input %s", program);
    wto(&buf);

    if (NULL == program)
    {
        buf.len = sprintf(buf.msg, "[Error] Missing paramter of module to load");
        wto(&buf);
        return 16;
    }

    void *PTR32 fnRaw = loadModule(program);

    if (NULL == fnRaw)
    {
        buf.len = sprintf(buf.msg, "[Error] Could not load program: '%s'", program);
        wto(&buf);
        return 20;
    }

    buf.len = sprintf(buf.msg, "[DEBUG] program address: x'%016X'", fnRaw);
    wto(&buf);

    buf.len = sprintf(buf.msg, "[DEBUG] parameters '%s'", parameters);
    wto(&buf);

    if ((int)fnRaw & 0x80000000)
    {
        fn31 = (ROUTINE31)((int)fnRaw & 0x7FFFFFFE);
        buf.len = sprintf(buf.msg, "[DEBUG] calling 31 bit routine...");
        wto(&buf);

        rc = fn31(&inData);

    } else if ((int)fnRaw & 0x00000001) {
        fn64 = (ROUTINE64)((int)fnRaw & 0x7FFFFFFE);
        buf.len = sprintf(buf.msg, "[DEBUG] calling 64 bit routine...");
        wto(&buf);

        rc = fn64(&inData);

    } else {
        buf.len = sprintf(buf.msg, "[ERROR] unexpected AMODE");
        wto(&buf);
    }

    buf.len = sprintf(buf.msg, "[DEBUG] routine complete, rc: %d", rc);
    wto(&buf);

    deleteModule(program);

    return rc;
}
