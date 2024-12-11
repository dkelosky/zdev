#ifndef STORAGE_H
#define STORAGE_H
#include <stdio.h>
#include "z.h"

#if defined(__IBM_METAL__)
#define STORAGE_OBTAIN(addr, size, loc)                         \
    __asm(                                                      \
        "*                                                  \n" \
        " LLGF  0,%1      = storage length                  \n" \
        "*                                                  \n" \
        " STORAGE OBTAIN,"                                      \
        "LENGTH=(0),"                                           \
        "CALLRKY=YES,"                                          \
        "LOC=(" #loc ",64),"                                    \
        "COND=NO                                            \n" \
        "*                                                  \n" \
        " ST    1,%0      -> Save storage address           \n" \
        "*                                                    " \
        : "=m"(addr)                                            \
        : "m"(size)                                             \
        : "r0", "r1", "r14", "r15");
#else
#define STORAGE_OBTAIN(addr, size, loc)
#endif

#if defined(__IBM_METAL__)
#define STORAGE_RELEASE(addr, size)                             \
    __asm(                                                      \
        "*                                                  \n" \
        " LLGF  0,%1      = storage length                  \n" \
        " LLGF  1,%0      -> storage address                \n" \
        "*                                                  \n" \
        " STORAGE RELEASE,"                                     \
        "LENGTH=(0),"                                           \
        "ADDR=(1),"                                             \
        "COND=NO,"                                              \
        "CALLRKY=YES                                        \n" \
        "*                                                    " \
        : "=m"(*(unsigned char *)addr)                          \
        : "m"(size)                                             \
        : "r0", "r1", "r14", "r15");
#else
#define STORAGE_RELEASE(addr, size)
#endif

#if defined(__IBM_METAL__)
#define IARST64_GET(size, areaaddr)                             \
    __asm(                                                      \
        "*                                                  \n" \
        " IARST64 REQUEST=GET,"                                 \
        "AREAADDR=%0,"                                          \
        "SIZE=%1,"                                              \
        "COMMON=NO,"                                            \
        "OWNINGTASK=CURRENT,"                                   \
        "FPROT=NO,"                                             \
        "TYPE=PAGEABLE,"                                        \
        "CALLERKEY=YES,"                                        \
        "FAILMODE=ABEND,"                                       \
        "REGS=SAVE                                          \n" \
        "*                                                    " \
        : "=m"(areaaddr)                                        \
        : "m"(size)                                             \
        \
: "r0", "r1", "r14", "r15");
#else
#define IARST64_GET(size, areaaddr)
#endif

#if defined(__IBM_METAL__)
#define IARST64_FREE(areaaddr, temp)                            \
    __asm(                                                      \
        "*                                                  \n" \
        " LA 2,%1        -> Storage address                 \n" \
        "*LG 3,%0        -> Storage address                 \n" \
        "*EXRL 0,*       -> Storage address                 \n" \
        "*                                                  \n" \
        " IARST64 REQUEST=FREE,"                                \
        "AREAADDR=(2),"                                         \
        "REGS=SAVE                                          \n" \
        "*                                                    " \
        : "=m"(*(unsigned char *)areaaddr)                      \
        : "m"(temp)                                             \
        : "r0", "r1", "r2", "r14", "r15");
#else
#define IARST64_FREE(areaaddr, temp)
#endif

static void *PTR32 storageObtain24(int size)
{
    void *PTR32 addr = NULL;
    STORAGE_OBTAIN(addr, size, 24);
    return addr;
}

static void *PTR32 storageObtain31(int size)
{
    void *PTR32 addr = NULL;
    STORAGE_OBTAIN(addr, size, 31);
    return addr;
}

static void storageRelease(void *PTR32 addr, int size)
{
    STORAGE_RELEASE(addr, size);
}

static void *PTR64 storageGet64(int size)
{
    void *PTR64 storage = NULL;

    IARST64_GET(size, storage);
    return storage;
}

static void storageFree64(void *PTR64 storage)
{
    void *PTR64 temp = storage;
    // memcpy(&temp, &storage, sizeof(void *PTR64));
    IARST64_FREE(storage, temp);
}

#endif
